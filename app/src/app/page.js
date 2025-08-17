"use client";

import { useState, useEffect } from "react";
import { useWallet } from "./contexts/WalletContext";
import { 
  Wallet, 
  MapPin, 
  Package, 
  Truck, 
  Utensils, 
  Wrench, 
  ArrowUpDown,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Navigation,
  DollarSign,
  Shield,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

export default function Home() {
  const {
    walletConnected,
    walletAddress,
    walletBalance,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    SEI_CONFIG
  } = useWallet();

  const [selectedService, setSelectedService] = useState("food");
  const [deliveryRequests, setDeliveryRequests] = useState([]);
  const [currentView, setCurrentView] = useState("main");
  const [escrowAmount, setEscrowAmount] = useState("0.00");

  // Mock data for demonstration
  const mockDeliveryRequests = [
    {
      id: "DR001",
      status: "pending",
      service: "food",
      item: "Pizza Margherita",
      sender: walletAddress || "0x1234...5678",
      receiver: "John Doe",
      amount: "25.00",
      timestamp: "2 min ago"
    },
    {
      id: "DR002", 
      status: "in-transit",
      service: "tools",
      item: "Drill Set",
      sender: walletAddress || "0x8765...4321",
      receiver: "Jane Smith",
      amount: "45.00",
      timestamp: "15 min ago"
    },
    {
      id: "DR003",
      status: "delivered",
      service: "pickup",
      item: "Documents",
      sender: walletAddress || "0x1111...2222",
      receiver: "Bob Johnson",
      amount: "15.00",
      timestamp: "1 hour ago"
    }
  ];

  useEffect(() => {
    setDeliveryRequests(mockDeliveryRequests);
  }, [walletAddress]);

  const postDeliveryRequest = () => {
    if (!walletConnected) {
      alert("Please connect your wallet first!");
      return;
    }
    setCurrentView("delivery-form");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "in-transit":
        return <Navigation className="w-5 h-5 text-blue-500" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "in-transit":
        return "status-transit";
      case "delivered":
        return "status-delivered";
      case "failed":
        return "status-failed";
      default:
        return "bg-gray-600";
    }
  };

  const getServiceIcon = (service) => {
    switch (service) {
      case "food":
        return <Utensils className="w-6 h-6" />;
      case "tools":
        return <Wrench className="w-6 h-6" />;
      case "pickup":
        return <ArrowUpDown className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
    }
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (currentView === "delivery-form") {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="glass-card p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                New Delivery Request
              </h1>
              <button
                onClick={() => setCurrentView("main")}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-8 h-8" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Service Type</label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="food">Food Delivery</option>
                    <option value="tools">Tool Delivery</option>
                    <option value="pickup">Pickup Service</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Pizza Margherita"
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    placeholder="Describe the item..."
                    rows={3}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="0.5"
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Escrow Amount (SEI)</label>
                  <input
                    type="number"
                    placeholder="25.00"
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Receiver Location</label>
                  <div className="h-64 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border border-white/20 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <MapPin className="w-12 h-12 mx-auto mb-2" />
                      <p>Map will be displayed here</p>
                      <p className="text-sm">Click to set location</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Receiver Details</label>
                  <input
                    type="text"
                    placeholder="Receiver Name"
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 mb-3"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setCurrentView("main")}
                className="px-6 py-3 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-3 gradient-primary rounded-lg text-white font-medium hover:opacity-90 transition-opacity">
                Submit Request
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="glass-card p-6 mb-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center animate-float">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                DroneDash
              </h1>
              <p className="text-gray-400">Web3 Drone Delivery on {SEI_CONFIG.chainName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {walletConnected ? (
              <div className="flex items-center space-x-4">
                <div className="glass p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Connected</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{formatAddress(walletAddress)}</div>
                </div>
                <div className="glass p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm">{walletBalance} SEI</span>
                    <button
                      onClick={refreshBalance}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Refresh Balance"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-600/30 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-end space-y-2">
                <button
                  onClick={connectWallet}
                  disabled={isLoading}
                  className="px-6 py-3 gradient-primary rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Wallet className="w-5 h-5" />
                  )}
                  <span>{isLoading ? "Connecting..." : "Connect Sei Wallet"}</span>
                </button>
                {error && (
                  <div className="flex items-center space-x-2 text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Section */}
          <div className="glass-card p-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4">Welcome to DroneDash</h2>
            <div className="flex gap-4 mb-6">
              <button
                onClick={postDeliveryRequest}
                disabled={!walletConnected}
                className="px-6 py-3 gradient-primary rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Package className="w-5 h-5" />
                <span>Post Request</span>
              </button>
              <button className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center space-x-2">
                <Wallet className="w-5 h-5" />
                <span>Add Wallet</span>
              </button>
            </div>
            
            <div className="flex space-x-4">
              {["food", "tools", "pickup"].map((service) => (
                <button
                  key={service}
                  onClick={() => setSelectedService(service)}
                  className={`p-3 rounded-lg flex items-center space-x-2 transition-all ${
                    selectedService === service
                      ? "gradient-accent text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {getServiceIcon(service)}
                  <span className="capitalize">{service}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Service Descriptions */}
          <div className="glass-card p-6 animate-fade-in-delay-1">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center">
                  <Utensils className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Order from Local Eateries</h3>
                  <p className="text-gray-400">Get your favorite meals delivered quickly and efficiently.</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                  <Wrench className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Tool Delivery</h3>
                  <p className="text-gray-400">Need tools for a quick fix? We'll get them to you in no time.</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-xl flex items-center justify-center">
                  <ArrowUpDown className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Pickup Services</h3>
                  <p className="text-gray-400">Have something to send? We'll pick it up and deliver it for you.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Status */}
          <div className="glass-card p-6 animate-fade-in-delay-2">
            <h2 className="text-2xl font-bold mb-6">Delivery Status</h2>
            <div className="space-y-4">
              {deliveryRequests.map((request) => (
                <div key={request.id} className="glass p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(request.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{request.id}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(request.status)}`}>
                            {request.status.replace("-", " ")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{request.item} • {request.amount} SEI</p>
                        <p className="text-xs text-gray-500">{request.timestamp}</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Wallet Section */}
          <div className="glass-card p-6 animate-fade-in">
            <h2 className="text-xl font-bold mb-4">Wallet</h2>
            <div className="space-y-4">
              <div className="glass p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-yellow-400" />
                  </div>
                  <span className="font-medium">My Wallet</span>
                </div>
                <div className="mt-3 text-2xl font-bold text-green-400">
                  Balance: {walletBalance} SEI
                </div>
                {walletAddress && (
                  <div className="mt-2 text-xs text-gray-400">
                    Address: {formatAddress(walletAddress)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Escrow & Tracking */}
          <div className="glass-card p-6 animate-fade-in-delay-1">
            <h2 className="text-xl font-bold mb-4">Escrow & Tracking</h2>
            <div className="space-y-4">
              <div className="glass p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Escrowed Amount</span>
                  <span className="text-lg font-bold text-green-400">{escrowAmount} SEI</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              
              <div className="glass p-4 rounded-lg">
                <h3 className="font-medium mb-2">Live Tracking</h3>
                <div className="h-32 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border border-white/20 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Navigation className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Real-time drone tracking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Eliza OS Intelligence */}
          <div className="glass-card p-6 animate-fade-in-delay-2">
            <h2 className="text-xl font-bold mb-4">Eliza OS Intelligence</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Route optimization active</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Weather monitoring</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Traffic analysis</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span>Battery management</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center mt-12 text-gray-400 animate-fade-in-delay-3">
        <p>Powered by blockchain technology for secure and transparent transactions.</p>
        <p className="text-sm mt-2">Built on {SEI_CONFIG.chainName} with Eliza OS + Hive Intelligence</p>
      </footer>
    </div>
  );
}
