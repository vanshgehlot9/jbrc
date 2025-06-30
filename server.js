const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const exceljs = require('exceljs');

const app = express();
const port = process.env.PORT || 3001;

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/jbrc_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log(' Connected to MongoDB');
}).catch((err) => {
    console.error('❌ MongoDB connection error:', err);
});

// Counter Schema for Auto-Incrementing BiltyNo
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

async function getNextSequenceValue(sequenceName) {
    const sequenceDocument = await Counter.findByIdAndUpdate(
        sequenceName,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return sequenceDocument.seq;
}

// Bilty Schema
const biltySchema = new mongoose.Schema({
    biltyNo: { type: Number, required: true, unique: true, index: true },
    biltyDate: { type: Date, required: true },
    truckNo: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    consignorName: { type: String, required: true },
    consignorGst: { type: String },
    consigneeName: { type: String, required: true },
    consigneeGst: { type: String },
    invoiceNo: { type: String },
    ewayNo: { type: String },
    transporterId: { type: String }, // For E-Way Bill
    grossValue: { type: Number },
    items: [{
        quantity: { type: Number, required: true },
        goodsDescription: { type: String, required: true },
        hsnCode: { String }, // For E-Way Bill
        weight: { type: Number, required: true },
        chargedWeight: { type: Number, required: true },
        rate: { type: String, required: true },
    }],
    charges: {
        freight: { type: Number, default: 0 },
        pf: { type: Number, default: 0 },
        lc: { type: Number, default: 0 },
        bc: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        cgst: { type: Number, default: 0 },
        sgst: { type: Number, default: 0 },
        igst: { type: Number, default: 0 },
        advance: { type: Number, default: 0 },
        grandTotal: { type: Number, required: true },
    },
    specialInstruction: { type: String },
    totalPackages: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Bilty = mongoose.model('Bilty', biltySchema);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/view', express.static(path.join(__dirname, 'view')));

// Serve company logo
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Routes
app.post('/api/create-bilty', async (req, res) => {
    try {
        const biltyData = req.body;
        
        const requiredFields = ['biltyDate', 'truckNo', 'from', 'to', 'consignorName', 'consigneeName', 'items', 'charges'];
        for (const field of requiredFields) {
            if (biltyData[field] === undefined || biltyData[field] === null) {
                return res.status(400).json({ message: `Field '${field}' is required` });
            }
        }

        if (!Array.isArray(biltyData.items) || biltyData.items.length === 0) {
            return res.status(400).json({ message: 'Items cannot be empty' });
        }
        if (typeof biltyData.charges.grandTotal !== 'number') {
            return res.status(400).json({ message: 'charges.grandTotal is required' });
        }

        biltyData.biltyNo = await getNextSequenceValue('biltyNo');

        const bilty = new Bilty(biltyData);
        await bilty.save();
        
        res.status(201).json({ 
            message: 'Bilty created successfully!',
            biltyId: bilty._id,
            biltyNo: bilty.biltyNo
        });
    } catch (error) {
        console.error('Error creating bilty:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all bilties
app.get('/api/bilties', async (req, res) => {
    try {
        const bilties = await Bilty.find().sort({ createdAt: -1 });
        res.json(bilties);
    } catch (error) {
        console.error('Error fetching bilties:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get a single bilty by ID
app.get('/api/bilty/:id', async (req, res) => {
    try {
        const bilty = await Bilty.findById(req.params.id);
        if (!bilty) {
            return res.status(404).json({ message: 'Bilty not found' });
        }
        res.json(bilty);
    } catch (error) {
        console.error('Error fetching bilty:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete a bilty
app.delete('/api/bilty/:id', async (req, res) => {
    try {
        const bilty = await Bilty.findByIdAndDelete(req.params.id);
        if (!bilty) {
            return res.status(404).json({ message: 'Bilty not found' });
        }
        res.json({ message: 'Bilty deleted successfully' });
    } catch (error) {
        console.error('Error deleting bilty:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update a bilty
app.put('/api/bilty/:id', async (req, res) => {
    try {
        const updatedBilty = await Bilty.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedBilty) {
            return res.status(404).json({ message: 'Bilty not found' });
        }
        res.json({ message: 'Bilty updated successfully!', bilty: updatedBilty });
    } catch (error) {
        console.error('Error updating bilty:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// --- Export to Excel ---
app.get('/api/bilties/export', async (req, res) => {
    try {
        const bilties = await Bilty.find().sort({ biltyNo: 1 }).lean();

        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Bilties');

        worksheet.columns = [
            { header: 'Bilty No', key: 'biltyNo', width: 10 },
            { header: 'Date', key: 'biltyDate', width: 15 },
            { header: 'Truck No', key: 'truckNo', width: 15 },
            { header: 'From', key: 'from', width: 20 },
            { header: 'To', key: 'to', width: 20 },
            { header: 'Consignor', key: 'consignorName', width: 30 },
            { header: 'Consignee', key: 'consigneeName', width: 30 },
            { header: 'Grand Total', key: 'grandTotal', width: 15, style: { numFmt: '"₹"#,##0.00' } },
            { header: 'E-Way No', key: 'ewayNo', width: 20 },
        ];

        bilties.forEach(bilty => {
            worksheet.addRow({
                ...bilty,
                grandTotal: bilty.charges ? bilty.charges.grandTotal : 0,
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="bilties.xlsx"');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Excel Export Error:', error);
        res.status(500).send('Failed to export data');
    }
});

// PDF Generation Route
app.get('/api/bilty/:id/pdf', async (req, res) => {
    try {
        const bilty = await Bilty.findById(req.params.id);
        if (!bilty) return res.status(404).send('Bilty not found');

        const pdfDir = path.join(__dirname, 'bilty_pdfs');
        if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);
        const filename = `bilty_${bilty.biltyNo}.pdf`;
        const filepath = path.join(pdfDir, filename);

        const doc = new PDFDocument({ size: 'A4', margin: 0 });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        const biltyHeight = 280.63; // A4 height (841.89) / 3

        drawBiltyOnDoc(doc, bilty, 0);
        doc.moveTo(20, biltyHeight).lineTo(575, biltyHeight).dash(5, {space: 5}).stroke('#AAAAAA');
        
        drawBiltyOnDoc(doc, bilty, biltyHeight);
        doc.moveTo(20, biltyHeight * 2).lineTo(575, biltyHeight * 2).dash(5, {space: 5}).stroke('#AAAAAA');

        drawBiltyOnDoc(doc, bilty, biltyHeight * 2);

        doc.end();
        
        stream.on('finish', () => {
            res.setHeader('Content-Type', 'application/pdf');
            fs.createReadStream(filepath).pipe(res);
        });

    } catch (err) {
        console.error('PDF generation error:', err);
        res.status(500).send('Failed to generate PDF');
    }
});

// --- E-Way Bill PDF Generation ---
app.get('/api/bilty/:id/ewaybill', async (req, res) => {
    try {
        const bilty = await Bilty.findById(req.params.id);
        if (!bilty) return res.status(404).send('Bilty not found');

        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const filename = `ewaybill_${bilty.biltyNo}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        doc.pipe(res);

        // --- Draw E-Way Bill Content ---
        doc.fontSize(14).font('Helvetica-Bold').text('e-Way Bill', { align: 'center'});
        doc.moveDown(2);

        const qrCodePath = path.join(__dirname, 'public', 'assets', 'qrcode_placeholder.png');
        if (fs.existsSync(qrCodePath)) {
            doc.image(qrCodePath, 450, 40, { width: 100 });
        }

        doc.fontSize(10).font('Helvetica-Bold').text('1. e-Way Bill Details');
        const detailsTableY = 120;
        doc.font('Helvetica').fontSize(9);
        doc.text(`e-Way Bill No. : ${bilty.ewayNo || 'N/A'}`, 40, detailsTableY);
        doc.text(`Generated Date : ${new Date().toLocaleDateString('en-GB')}`, 250, detailsTableY);
        doc.text(`Generated By : ${bilty.consignorGst || 'N/A'}`, 40, detailsTableY + 15);
        doc.text(`Valid Upto : N/A`, 250, detailsTableY + 15);
        doc.moveDown(2);

        doc.fontSize(10).font('Helvetica-Bold').text('2. Address Details');
        const addressTableY = 180;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('From', 40, addressTableY);
        doc.text('To', 280, addressTableY);
        doc.font('Helvetica').fontSize(9);
        doc.text(bilty.consignorName, 40, addressTableY + 15);
        doc.text(bilty.consigneeName, 280, addressTableY + 15);
        doc.text(bilty.consignorAddress || '', 40, addressTableY + 30, { width: 200 });
        doc.text(bilty.consigneeAddress || '', 280, addressTableY + 30, { width: 200 });
        doc.moveDown(6);
        
        doc.fontSize(10).font('Helvetica-Bold').text('3. Goods Details');
        const goodsTableY = doc.y;
        let tableTop = goodsTableY + 15;
        const hsnX = 40, descX = 120, qtyX = 350, taxX = 420, rateX = 480;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('HSN Code', hsnX, tableTop);
        doc.text('Product Name & Description', descX, tableTop);
        doc.text('Quantity', qtyX, tableTop);
        doc.text('Taxable Amt', taxX, tableTop);
        doc.text('Tax Rate', rateX, tableTop);
        doc.font('Helvetica').fontSize(9);
        tableTop += 15;

        let totalTaxable = 0;
        bilty.items.forEach(item => {
            const taxableAmount = (item.chargedWeight || 0) * (parseFloat(item.rate) || 0);
            totalTaxable += taxableAmount;
            doc.text(item.hsnCode || 'N/A', hsnX, tableTop);
            doc.text(item.goodsDescription, descX, tableTop, { width: 220 });
            doc.text(item.quantity, qtyX, tableTop);
            doc.text(taxableAmount.toFixed(2), taxX, tableTop);
            doc.text('18%', rateX, tableTop); // Assuming a static tax rate for now
            tableTop += 20;
        });
        doc.moveDown(4);

        doc.fontSize(10).font('Helvetica-Bold').text('4. Transportation Details');
        doc.font('Helvetica').fontSize(9);
        doc.text(`Transporter ID: ${bilty.transporterId || 'N/A'}`, 40, doc.y);
        doc.text(`Transporter Name: JODHPUR BOMBAY ROAD CARRIER`, 40, doc.y + 15);
        doc.text(`Vehicle No.: ${bilty.truckNo}`, 40, doc.y + 30);
        
        doc.end();

    } catch (err) {
        console.error('E-Way Bill PDF generation error:', err);
        res.status(500).send('Failed to generate E-Way Bill PDF');
    }
});

// Helper function for the new PDF generation
function drawBiltyOnDoc(doc, bilty, yOffset) {
    doc.save();
    doc.translate(0, yOffset);

    const font = 'Helvetica';
    const boldFont = 'Helvetica-Bold';
    const strokeColor = '#000000';

    const hindiFontPath = path.join(__dirname, 'public', 'fonts', 'NotoSansDevanagari-Regular.ttf');
    const hindiFontName = 'HindiFont';
    if (fs.existsSync(hindiFontPath)) {
        doc.registerFont(hindiFontName, hindiFontPath);
    }

    // --- Static Header Info ---
    const logoPath = path.join(__dirname, 'public', 'assets', 'logo.png');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 35, 25, { width: 40 });
    }
    doc.fontSize(8).font(font).text('GSTIN 08AAAHL5963P1ZK', 35, 15);
    doc.fontSize(18).font(boldFont).text('Jodhpur Bombay Road Carrier', 0, 30, { align: 'center' });
    doc.fontSize(9).font(font).text('P.No. 69, Transport Nagar, IInd Phase Basni, JODHPUR', 0, 48, { align: 'center' });
    
    if (fs.existsSync(hindiFontPath)) {
        doc.font(hindiFontName).fontSize(10).text('|| जय बाबा री || || ॐ ||', 0, 15, { align: 'center' });
    } else {
        doc.font(font).fontSize(8).text('[Hindi Font Not Found]', 0, 15, { align: 'center' });
    }
    doc.font(font).fontSize(8).text('All disputes Subject to JODHPUR Jurisdiction', 0, 60, {align: 'center'});

    doc.fontSize(8).font(font).text('For : Jodhpur Bombay Road Carrier', 450, 15);
    doc.fontSize(8).font(font).text('(O) 0291-2747679', 450, 28);
    doc.fontSize(8).font(font).text('(R) 2540007', 450, 38);
    doc.fontSize(8).font(font).text('M. 9314710568', 450, 48);
    doc.fontSize(8).font(font).text('9782177007', 450, 58);

    // --- Dynamic Header ---
    doc.rect(30, 70, 535, 30).stroke(strokeColor);
    
    let headerX = 35;
    const addHeaderField = (label, value, width) => {
        doc.fontSize(10).font(boldFont).text(label, headerX, 75);
        doc.fontSize(10).font(font).text(value, headerX + 35, 75);
        headerX += width;
        if (headerX < 560) doc.moveTo(headerX - 5, 70).lineTo(headerX - 5, 100).stroke(strokeColor);
    };
    addHeaderField('Bilty No.', bilty.biltyNo, 120);
    addHeaderField('Date', new Date(bilty.biltyDate).toLocaleDateString('en-GB'), 120);
    addHeaderField('From', bilty.from, 130);
    addHeaderField('To', bilty.to, 100);

    doc.rect(30, 85, 535, 15).stroke(strokeColor); 
    doc.moveTo(240, 85).lineTo(240, 100).stroke(strokeColor);
    doc.fontSize(10).font(boldFont).text('Truck No.', 250, 88);
    doc.fontSize(10).font(font).text(bilty.truckNo, 300, 88);
    
    // --- Parties ---
    doc.rect(30, 100, 267.5, 50).stroke(strokeColor);
    doc.fontSize(10).font(boldFont).text('CONSIGNOR :-', 35, 105);
    doc.fontSize(10).font(font).text(bilty.consignorName, 110, 105);
    doc.fontSize(10).font(boldFont).text('GSTIN', 35, 120);
    doc.fontSize(10).font(font).text(bilty.consignorGst || '', 110, 120);
    
    doc.rect(297.5, 100, 267.5, 50).stroke(strokeColor);
    doc.fontSize(10).font(boldFont).text('CONSIGNEE :-', 302.5, 105);
    doc.fontSize(10).font(font).text(bilty.consigneeName, 377.5, 105);
    doc.fontSize(10).font(boldFont).text('GSTIN', 302.5, 120);
    doc.fontSize(10).font(font).text(bilty.consigneeGst || '', 377.5, 120);

    // --- Main Content Table ---
    const tableTop = 150;
    doc.rect(30, tableTop, 535, 100).stroke(strokeColor);
    
    doc.rect(30, tableTop, 50, 20).stroke(strokeColor);
    doc.fontSize(10).font(boldFont).text('Pkgs.', 40, tableTop + 5);

    doc.rect(80, tableTop, 180, 20).stroke(strokeColor);
    doc.fontSize(10).font(boldFont).text('DESCRIPTION (Said to Contain)', 90, tableTop + 5);

    doc.rect(260, tableTop, 150, 10).stroke(strokeColor);
    doc.fontSize(8).font(boldFont).text('Weight Actual', 295, tableTop + 1, {align: 'center'});
    doc.rect(260, tableTop+10, 75, 10).stroke(strokeColor);
    doc.fontSize(8).font(boldFont).text('Actual Kg.', 265, tableTop + 11);
    doc.rect(335, tableTop+10, 75, 10).stroke(strokeColor);
    doc.fontSize(8).font(boldFont).text('Charged Kg.', 340, tableTop + 11);

    doc.rect(410, tableTop, 50, 20).stroke(strokeColor);
    doc.fontSize(10).font(boldFont).text('Rate', 420, tableTop + 5);

    doc.rect(460, tableTop, 105, 20).stroke(strokeColor);
    doc.fontSize(10).font(boldFont).text('Freight To', 485, tableTop + 5);

    const firstItem = bilty.items[0] || {};
    doc.fontSize(10).font(font).text(firstItem.quantity || '', 40, tableTop + 25);
    doc.fontSize(10).font(font).text(firstItem.goodsDescription || '', 90, tableTop + 25, {width: 170});
    doc.fontSize(10).font(font).text(firstItem.weight ? firstItem.weight.toFixed(2) : '', 265, tableTop + 25);
    doc.fontSize(10).font(font).text(firstItem.chargedWeight || '', 340, tableTop + 25);
    doc.fontSize(10).font(font).text(firstItem.rate || '', 415, tableTop + 25, {width: 40});

    doc.fontSize(9).font(font).text(`Inv. No. ${bilty.invoiceNo || ''}`, 90, tableTop + 70);
    doc.fontSize(9).font(font).text(`EWay No. ${bilty.ewayNo || ''}`, 90, tableTop + 85);
    doc.fontSize(9).font(font).text(`G.V. ${bilty.grossValue || ''}`, 200, tableTop + 85);

    const charges = bilty.charges || {};
    const chargesX = 465;
    let chargesY = tableTop + 22;
    const chargesLineHeight = 11;
    function addCharge(label, value) {
        doc.fontSize(9).font(font).text(label, chargesX, chargesY);
        doc.fontSize(9).font(font).text(value !== undefined ? value.toFixed(2) : '0.00', {width: 55, align: 'right'});
        chargesY += chargesLineHeight;
    }
    doc.moveTo(chargesX-5, tableTop + 20).lineTo(chargesX-5, tableTop + 100).stroke(strokeColor);

    addCharge('Freight', charges.freight);
    addCharge('P.F.', charges.pf);
    addCharge('L.C.', charges.lc);
    addCharge('B.C.', charges.bc);
    doc.moveTo(chargesX, chargesY-5).lineTo(565, chargesY-5).stroke(strokeColor);
    addCharge('Total', charges.total);
    addCharge('CGST', charges.cgst);
    addCharge('SGST', charges.sgst);
    addCharge('IGST', charges.igst);
    addCharge('Adv. Amt.', charges.advance);
    
    doc.rect(460, chargesY, 105, 15).stroke(strokeColor);
    doc.fontSize(10).font(boldFont).text('G. Total', chargesX, chargesY + 3);
    doc.fontSize(10).font(boldFont).text(charges.grandTotal.toFixed(2), chargesX + 40, chargesY + 3, {width: 55, align: 'right'});

    // --- Footer ---
    doc.rect(30, tableTop+100, 50, 15).stroke(strokeColor);
    doc.fontSize(10).font(boldFont).text(bilty.totalPackages || '', 40, tableTop + 103);
    doc.fontSize(9).font(font).text('Term & Contd. - Any leakage and breaking goods are not responsible and no claim for this.', 85, tableTop + 103);
    doc.fontSize(9).font(font).text(`Special Instruction - ${bilty.specialInstruction || 'Goods to Insured by party'}`, 85, tableTop + 118);

    doc.fontSize(10).font(font).text('DINESH TAK', 450, tableTop + 125, {align: 'center'});
    doc.fontSize(9).font(boldFont).text('For : Jodhpur Bombay Road Carrier', 450, tableTop + 138, {align: 'center'});

    doc.restore();
}

const shortRoutes = [
    'create-bilty',
    'view-bilties',
    'edit-bilty',
    'generate-e-way-bill',
    'export-to-excel',
    'challan',
    'generate-daily-report',
    'send-payment-reminder',
    'schedule-weekly-summary'
];

shortRoutes.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, 'view', 'forms', `${page}.html`));
    });
});

app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
});
