# DroneDash - Web3 Drone Delivery on Sei

A decentralized drone delivery platform powered by Sei blockchain with smart contract escrow and Eliza OS intelligence.

## 🚀 Features

- **Wallet Integration**: Connect your Compass/Keplr wallet to Sei network
- **Delivery Requests**: Post food, tools, or pickup service requests
- **Smart Contract Escrow**: Secure payment locking for successful deliveries
- **Real-time Tracking**: Monitor delivery status and drone routes
- **Eliza OS Intelligence**: AI-powered route optimization and monitoring

## 🔗 Wallet Connection

### Prerequisites
1. **Install Keplr Wallet**: Download from [https://keplr.app/](https://keplr.app/)
2. **Add Sei Network**: The app will automatically configure Sei network settings
3. **Have SEI tokens**: Ensure your wallet has SEI tokens for transactions

### Connection Steps
1. Click "Connect Sei Wallet" button
2. Approve the connection in your Keplr wallet
3. Select the Sei network when prompted
4. Your wallet address and balance will be displayed

## 🛠️ Development

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## 🌐 Network Configuration

The app is configured for:
- **Testnet**: `sei-devnet-3` (default)
- **Mainnet**: `sei-mainnet-1` (change in WalletContext.js)

## 📱 Usage

1. **Connect Wallet**: Connect your Sei wallet to access the platform
2. **Post Request**: Create delivery requests for food, tools, or pickup services
3. **Set Escrow**: Lock payment in smart contract escrow
4. **Track Delivery**: Monitor real-time delivery status and routes
5. **Complete Delivery**: Drone gets paid only upon successful delivery

## 🔒 Security Features

- Smart contract escrow for secure payments
- Wallet-based authentication
- Real-time balance monitoring
- Automatic balance refresh

## 🎨 UI/UX Features

- Futuristic Web3 design with glassmorphism effects
- Responsive dashboard layout
- Smooth animations and transitions
- Dark theme with gradient accents

## 🚁 Drone Integration

- Eliza OS intelligence for route optimization
- Weather monitoring and traffic analysis
- Battery management and safety protocols
- Real-time location tracking

## 📄 License

This project is licensed under the MIT License.
