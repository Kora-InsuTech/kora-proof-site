<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZK Insurance Proof System</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
    <style>
        .loading-spinner {
            border-top-color: #3498db;
            -webkit-animation: spinner 1.5s linear infinite;
            animation: spinner 1.5s linear infinite;
        }
        
        @-webkit-keyframes spinner {
            0% { -webkit-transform: rotate(0deg); }
            100% { -webkit-transform: rotate(360deg); }
        }
        
        @keyframes spinner {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto py-8 px-4">
        <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div class="bg-blue-600 text-white p-4">
                <h1 class="text-2xl font-bold text-center">ZK Insurance System</h1>
                <p class="text-center text-blue-100">Privacy-preserving driver verification</p>
            </div>
            
            <div class="p-6">
                <div class="mb-6 p-4 bg-blue-50 rounded-lg">
                    <p class="font-semibold mb-2">How it works:</p>
                    <ol class="list-decimal list-inside text-gray-700 space-y-1 pl-2">
                        <li>Enter your speed value (lower values represent safer driving behavior)</li>
                        <li>The system generates a zero-knowledge proof that your value is below the threshold</li>
                        <li>The smart contract verifies your proof without seeing your actual speed data</li>
                        <li>If verified, you're added to the insured drivers list</li>
                    </ol>
                </div>
                
                <div id="wallet-section" class="mb-6 flex justify-center">
                    <button id="connect-wallet" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors">
                        Connect Wallet
                    </button>
                    <div id="wallet-address" class="hidden text-sm bg-green-100 text-green-800 rounded-full px-4 py-2"></div>
                </div>
                
                <div id="insurance-status" class="hidden bg-green-100 p-4 rounded-lg text-center mb-6">
                    <p class="text-xl font-semibold text-green-700">✓ You are insured!</p>
                    <p class="text-gray-700">Your driving data meets our requirements.</p>
                </div>
                
                <div id="input-section" class="hidden">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="speed-value">
                            Enter your driving speed value (lower is better):
                        </label>
                        <input
                            id="speed-value"
                            type="number"
                            min="0"
                            max="100"
                            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Enter a value between 0-100"
                        />
                        <p class="text-sm text-gray-500 mt-1">Values below 50 will qualify for insurance</p>
                    </div>
                    
                    <div