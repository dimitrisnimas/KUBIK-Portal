# Kubik Portal Frontend

A modern React-based client portal for managing eShop development, social media management, advertising, plugin creation, and change requests.

## Features

- **User Authentication**: Custom registration and login system
- **Dashboard**: Overview of services, assets, and recent activity
- **Asset Management**: Manage eShops, social media accounts, and websites
- **Service Packages**: Subscribe to eShop support and social media management packages
- **Ticket System**: Submit support requests and change requests with dynamic pricing
- **Billing**: View invoices and payment history with manual payment instructions
- **Profile Management**: Update personal and business information

## Tech Stack

- **React 18** with Vite for fast development
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **Axios** for API communication
- **Lucide React** for icons
- **React Hot Toast** for notifications

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to Cloudflare Pages.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.jsx      # Main layout with navigation
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication state management
├── lib/               # Utility libraries
│   └── api.js         # API client configuration
├── pages/             # Page components
│   ├── Login.jsx      # Authentication pages
│   ├── Register.jsx
│   ├── Dashboard.jsx  # Main dashboard
│   ├── Assets.jsx     # Asset management
│   ├── Services.jsx   # Service packages
│   ├── Tickets.jsx    # Support tickets
│   ├── Billing.jsx    # Invoice management
│   └── Profile.jsx    # User profile
├── App.jsx            # Main app component with routing
├── main.jsx          # Application entry point
└── index.css         # Global styles and Tailwind imports
```

## API Integration

The frontend communicates with the backend API through the `/api` proxy configured in `vite.config.js`. All API calls are handled through the `api.js` utility which includes:

- Automatic session handling
- Error interception
- Authentication redirects

## Deployment

### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Set build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js version: 18

3. Set environment variables:
   - `VITE_API_URL`: Your backend API URL (e.g., `https://api.yourdomain.com`)

### Environment Variables

Create a `.env` file for local development:

```env
VITE_API_URL=http://localhost:5000
```

## Features Overview

### Authentication
- Custom registration with business details
- Secure login/logout
- Password reset functionality
- Session management

### Dashboard
- Overview statistics
- Quick actions
- Recent tickets
- Service status

### Asset Management
- Add/edit/delete assets
- Support for eShops, social media, and websites
- Collaborator invitations
- Asset categorization

### Services
- eShop support packages (Basic, Standard, Premium)
- Social media management packages (Starter, Growth, Enterprise)
- Package comparison and selection
- Service cancellation

### Tickets
- Support request submission
- Change request management
- File attachments
- Dynamic pricing based on active packages
- Priority levels and categories

### Billing
- Invoice viewing and download
- Payment instructions
- Payment history
- Manual payment processing

### Profile
- Personal information management
- Business details
- Password changes
- Account settings

## Customization

### Styling
The application uses Tailwind CSS with custom components defined in `src/index.css`. You can customize:

- Color scheme in `tailwind.config.js`
- Component styles in the CSS file
- Button and input styles

### API Endpoints
Update API endpoints in `src/lib/api.js` and individual page components as needed.

### Email Templates
Email templates are handled by the backend. Update the backend email templates for customization.

## Development

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use TypeScript for better type safety (optional)
- Maintain consistent naming conventions

### Testing
Add testing with Jest and React Testing Library:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

### Performance
- Lazy load components where appropriate
- Optimize images and assets
- Use React.memo for expensive components
- Implement proper error boundaries

## Support

For issues and questions:
1. Check the backend API documentation
2. Review the browser console for errors
3. Verify API connectivity
4. Check environment variables

## License

This project is proprietary software for Kubik Digital Services. 