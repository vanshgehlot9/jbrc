# JODHPUR BOMBAY ROAD CARRIER - Bilty Management System

A modern web application for managing bilty (transport documents) for Jodhpur Bombay Road Carrier. Built with Node.js, Express, MongoDB, and modern CSS.

## 🚀 Features

- **Create Bilty**: Generate new transport documents with comprehensive details
- **Modern UI**: Clean, responsive design with excellent user experience
- **Form Validation**: Client-side and server-side validation
- **Database Storage**: MongoDB integration for data persistence
- **PDF Generation**: Generate PDF documents (planned feature)
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 📁 Project Structure

```
jbrc_fixed_ui_and_css/
├── public/
│   ├── css/
│   │   └── styles.css          # Main stylesheet
│   └── js/
│       └── create-bilty.js     # Bilty creation logic
├── view/
│   ├── forms/
│   │   ├── create-bilty.html   # Bilty creation form
│   │   ├── challan.html        # Challan form
│   │   ├── generate-e-way-bill.html
│   │   └── ...                 # Other forms
│   ├── dashboard/              # Dashboard views
│   └── styles/                 # Additional styles
├── bilty_pdfs/                 # Generated PDF storage
├── server.js                   # Express server
├── package.json                # Dependencies
└── README.md                   # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jbrc_fixed_ui_and_css
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start MongoDB**
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On Windows
   net start MongoDB
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Access the application**
   - Open your browser and go to `http://localhost:3001`
   - Navigate to `/create-bilty` to create a new bilty

## 📋 API Endpoints

### POST `/api/create-bilty`
Creates a new bilty document.

**Request Body:**
```json
{
  "biltyDate": "2024-01-15",
  "consignorName": "John Doe",
  "consigneeName": "Jane Smith",
  "consignorAddress": "123 Main St, City",
  "consigneeAddress": "456 Oak Ave, Town",
  "goodsDescription": "Electronics",
  "quantity": 10,
  "weight": 25.5,
  "freightCharges": 1500.00
}
```

**Response:**
```json
{
  "message": "Bilty created successfully!",
  "biltyId": "507f1f77bcf86cd799439011"
}
```

### GET `/api/bilties`
Retrieves all bilty documents.

## 🎨 UI Components

### Form Styling
- Modern input fields with focus states
- Real-time validation feedback
- Responsive grid layout
- Loading states and animations

### Color Scheme
- Primary: `#5C7285` (Blue-gray)
- Secondary: `#FFB4A2` (Coral)
- Accent: `#FFCDB2` (Light coral)
- Background: `#f8f9fa` (Light gray)

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/jbrc_db
NODE_ENV=development
```

### Database Configuration
The application connects to MongoDB at `mongodb://localhost:27017/jbrc_db` by default. You can modify this in `server.js`.

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check if the database URL is correct
   - Verify MongoDB is installed and accessible

2. **Port Already in Use**
   - Change the port in `server.js` or `.env`
   - Kill the process using the port: `lsof -ti:3001 | xargs kill -9`

3. **CSS Not Loading**
   - Check if the static file serving is configured correctly
   - Verify file paths in HTML files

4. **Form Submission Errors**
   - Check browser console for JavaScript errors
   - Verify all required fields are filled
   - Ensure the API endpoint is accessible

## 📝 Development

### Adding New Features

1. **New Form Pages**
   - Create HTML file in `view/forms/`
   - Add route in `server.js`
   - Create corresponding JavaScript file in `public/js/`

2. **New API Endpoints**
   - Add routes in `server.js`
   - Create MongoDB schemas as needed
   - Implement proper error handling

3. **Styling**
   - Add CSS classes in `public/css/styles.css`
   - Follow the existing design system
   - Ensure responsive design

### Code Style

- Use consistent indentation (2 spaces)
- Follow JavaScript ES6+ conventions
- Use meaningful variable and function names
- Add comments for complex logic

## 📄 License

This project is proprietary software for Jodhpur Bombay Road Carrier.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team.

---

**Version:** 1.0.0  
**Last Updated:** January 2024 