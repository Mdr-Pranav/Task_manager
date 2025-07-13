# Task Manager

A modern, feature-rich task management application built with Node.js and Vanilla JavaScript, featuring a responsive UI powered by Tailwind CSS.

## Features

- 📋 Task Management

  - Create, edit, and delete tasks
  - Set task priorities (Low, Medium, High)
  - Track task status (Todo, In Progress, Completed)
  - Add subtasks to break down complex tasks
  - Set due dates for better time management

- 📁 Category Organization

  - Create and manage task categories
  - Filter tasks by category
  - Organize tasks efficiently

- 📊 Dashboard

  - View task statistics
  - Track recent tasks
  - Monitor due tasks
  - Visual charts and metrics

- 🌙 Dark Mode Support

  - Toggle between light and dark themes
  - Persistent theme preference

- 📝 Notes
  - Add notes to tasks
  - Keep track of important details

## Tech Stack

- **Backend**

  - Node.js
  - Express.js
  - Sequelize ORM
  - MySQL Database
  - Security features (Helmet, CORS)
  - Compression for better performance

- **Frontend**
  - Vanilla JavaScript
  - Tailwind CSS
  - Font Awesome icons
  - Responsive design
  - Modern UI/UX

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)

## Installation

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd task-manager
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASS=your_password
   DB_NAME=task_manager
   ```

4. Initialize the database:
   ```bash
   # The database will be automatically initialized when you start the server
   npm start
   ```

## Usage

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Start the production server:

   ```bash
   npm start
   ```

3. Access the application:
   - Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
Task_manager/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── associations.js
│   │   ├── Category.js
│   │   ├── Subtask.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── categories.js
│   │   ├── settings.js
│   │   └── tasks.js
│   └── server.js
├── frontend/
│   ├── app.js
│   ├── dark-mode.css
│   ├── index.html
│   ├── js/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── styles.css
├── package.json
└── tailwind.config.js
```

## Security Features

- CORS protection
- Helmet security headers
- Content Security Policy
- XSS protection
- Secure cookie handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.
