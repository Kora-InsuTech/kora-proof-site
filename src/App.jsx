import { useState, useEffect } from "react";
import "./index.css";
import { ethers } from "ethers";
import contractABI from "./artifacts/InsuranceUnderwriting.json";

const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const getProvider = (ethereum) => {
  console.log("Checking ethers version...");
  
  if (ethers.providers && ethers.providers.Web3Provider) {
    console.log("Using ethers v5");
    return new ethers.providers.Web3Provider(ethereum);
  } 
  else if (ethers.BrowserProvider) {
    console.log("Using ethers v6");
    return new ethers.BrowserProvider(ethereum);
  }
  else {
    console.error("Compatible ethers provider not found");
    throw new Error("Ethers library not properly loaded. Check your imports.");
  }
};


const getSnarkjs = () => {
  if (typeof window !== 'undefined' && window.snarkjs) {
    return window.snarkjs;
  } else {
    console.error("snarkjs not found on window object");
    throw new Error("snarkjs library not loaded");
  }
};

const generateProof = async (speed) => {
  console.log(`Generating proof for speed: ${speed}`);
  const input = { avgSpeed: Math.round(speed * 100), threshold: 120 * 100 };
  try {
    const snarkjs = getSnarkjs();
    const { proof, publicSignals } = await snarkjs.plonk.fullProve(
      input,
      "/circuit.wasm",
      "/circuit_final.zkey"
    );
    return { proof, publicSignals };
  } catch (error) {
    console.error("Full proof generation error:", error);
    throw new Error(`Proof generation failed: ${error.message}`);
  }
};

const formatProofForContract = (proof) => {
  if (!proof || !proof.A || !proof.B || !proof.C || !proof.Z || !proof.T1 || !proof.T2 || !proof.T3 || !proof.Wxi || !proof.Wxiw) {
    console.error("Invalid proof format:", proof);
    throw new Error("Proof has invalid format");
  }

  return [
    proof.A[0], proof.A[1],
    proof.B[0], proof.B[1],
    proof.B[0], proof.B[1],
    proof.C[0], proof.C[1],
    proof.Z[0], proof.Z[1],
    proof.T1[0], proof.T1[1],
    proof.T2[0], proof.T2[1],
    proof.T3[0], proof.T3[1],
    proof.Wxi[0], proof.Wxi[1],
    proof.Wxiw[0], proof.Wxiw[1],
    0, 0, 0, 0
  ];
};

const SpeedVerificationApp = () => {
  const [speed, setSpeed] = useState(85);
  const [account, setAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [violationHistory, setViolationHistory] = useState([]);
  const [proofData, setProofData] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [displayMode, setDisplayMode] = useState("basic");
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);

  console.log("Component mounted");

  const connectWallet = async () => {
    console.log("Connecting wallet...");
    try {
      if (!window.ethereum) {
        setMessage("Please install MetaMask to use this application");
        return;
      }

      try {
        console.log("Ethers object:", ethers);

        const web3Provider = getProvider(window.ethereum);
        console.log("Provider created:", web3Provider);
        
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setProvider(web3Provider);
          setIsConnected(true);

          let signer;
          if (web3Provider.getSigner) {
            signer = web3Provider.getSigner();
          } else {
            signer = await web3Provider.getSigner();
          }
          
          console.log("Signer:", signer);
          console.log("ABI:", contractABI.abi);
          
          const insuranceContract = new ethers.Contract(
            contractAddress, 
            contractABI.abi, 
            signer
          );
          
          setContract(insuranceContract);
          setMessage("Wallet connected!");

          try {
            await loadViolationHistory(accounts[0], insuranceContract, web3Provider);
          } catch (historyError) {
            console.error("Error loading violation history:", historyError);
          }
        } else {
          setMessage("No accounts found. Please check your MetaMask.");
        }
      } catch (providerError) {
        console.error("Provider error:", providerError);
        setMessage(`Error with provider: ${providerError.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      setMessage(`Error connecting wallet: ${error.message || "Unknown error"}`);
    }
  };

  const loadViolationHistory = async (driverAddress, insuranceContract, providerInstance) => {
    if (!insuranceContract || !providerInstance) {
      console.log("Missing contract or provider for loadViolationHistory");
      return;
    }

    try {
      const filter = insuranceContract.filters.DriverInsured(driverAddress);
      const events = await insuranceContract.queryFilter(filter, 0, "latest");
      const history = await Promise.all(events.map(async (event) => {
        const block = await providerInstance.getBlock(event.blockNumber);
        return {
          timestamp: block.timestamp * 1000,
          count: events.length,
          txHash: event.transactionHash,
        };
      }));
      setViolationHistory(history);
    } catch (error) {
      console.error("Error loading history:", error);
      setMessage("Failed to load violation history");
    }
  };

  const handleGenerateProof = async () => {
    setIsLoading(true);
    setMessage("Generating zero-knowledge proof...");
    try {
      const proofResult = await generateProof(speed);
      console.log("Proof generated:", proofResult);
      setProofData(proofResult);
      setMessage("Proof generated successfully! You can now submit it to the blockchain.");
    } catch (error) {
      console.error("Proof generation error:", error);
      setMessage(`Error generating proof: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!proofData || !contract) {
      setMessage("Please generate a proof and connect your wallet first");
      return;
    }

    setIsLoading(true);
    setMessage("Submitting proof to blockchain...");
    try {
      const formattedProof = formatProofForContract(proofData.proof);
      console.log("Formatted proof:", formattedProof);
      console.log("Public signals:", proofData.publicSignals);
      
      const tx = await contract.submitProof(formattedProof, proofData.publicSignals, { gasLimit: 500000 });
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
      setTxHash(receipt.transactionHash);

      const updatedHistory = [
        ...violationHistory,
        {
          timestamp: Date.now(),
          count: violationHistory.length + 1,
          txHash: receipt.transactionHash,
        },
      ];
      setViolationHistory(updatedHistory);

      setMessage("Proof submitted and verified on-chain!");
    } catch (error) {
      console.error("Submit proof error:", error);
      setMessage(`Error submitting proof: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDisplayMode = () => {
    setDisplayMode(displayMode === "basic" ? "advanced" : "basic");
  };

  useEffect(() => {
    console.log("useEffect running - wallet connection check");

    if (typeof window.ethereum !== 'undefined') {
      console.log("MetaMask is installed");


      const handleAccountsChanged = async (accounts) => {
        console.log("Accounts changed:", accounts);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (contract && provider) {
            loadViolationHistory(accounts[0], contract, provider);
          }
        } else {
          setIsConnected(false);
          setAccount("");
          setContract(null);
          setProvider(null);
          setMessage("Wallet disconnected");
        }
      };
      
      window.ethereum.on("accountsChanged", handleAccountsChanged);

      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            console.log("Already connected to account:", accounts[0]);
            connectWallet();
          }
        })
        .catch(err => console.error("Error checking accounts:", err));

      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    } else {
      console.log("MetaMask is not installed");
    }
  }, []);

  useEffect(() => {
    if (contract && provider && account) {
      console.log("Loading violation history for account:", account);
      loadViolationHistory(account, contract, provider);
    }
  }, [contract, provider, account]);

  console.log("Rendering with isConnected:", isConnected);

  return (
    <div className="flex flex-col items-center justify-center w-full bg-blue-900 min-h-screen p-4">
      <div className="text-center mb-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-white">Zero-Knowledge Speed Verification</h1>
        {!isConnected ? (
          <div className="bg-white shadow-lg rounded-lg p-8 mx-auto max-w-md border-2 border-blue-200 mt-4">
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md text-center w-full"
            >
              Connect Wallet
            </button>
            <p className="mt-4 text-blue-700 text-center">{message}</p>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden border-2 border-blue-200 mt-4">
            <div className="bg-blue-800 text-white p-4 text-center">
              <h2 className="text-xl font-semibold">Zero-Knowledge Speed Verification</h2>
              <p className="text-blue-200 text-sm">
                Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </p>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-blue-800 mb-2 text-center font-medium">
                  Enter Average Vehicle Speed (km/h)
                </label>
                <input
                  type="number"
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value) || 0)}
                  className="w-full border p-2 rounded"
                />
                <div className="flex justify-between">
                  <span className="text-blue-600">50 km/h</span>
                  <span className="font-bold text-blue-800">{speed} km/h</span>
                  <span className="text-blue-600">150 km/h</span>
                </div>
                <div className="mt-1 text-sm text-blue-600 text-center">
                  This application will prove if your speed is{" "}
                  {speed > 120 ? (
                    <span className="text-red-600 font-medium">above</span>
                  ) : (
                    <span className="text-green-600 font-medium">within</span>
                  )}{" "}
                  the 120 km/h limit
                </div>
              </div>

              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={handleGenerateProof}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-md disabled:bg-gray-400 w-full max-w-xs"
                >
                  Generate Proof
                </button>
                <button
                  onClick={handleSubmitProof}
                  disabled={isLoading || !proofData}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-md disabled:bg-gray-400 w-full max-w-xs"
                >
                  Submit Proof
                </button>
              </div>

              {message && (
                <div
                  className={`mb-6 p-3 rounded-lg text-center ${
                    message.includes("Error")
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800 border border-blue-300"
                  }`}
                >
                  {message}
                </div>
              )}

              {txHash && (
                <div className="mb-6 p-3 bg-blue-100 text-blue-800 rounded-lg text-center border border-blue-300">
                  <p className="font-medium">Transaction Hash:</p>
                  <p className="text-sm break-all">{txHash}</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View on Etherscan
                  </a>
                </div>
              )}

              {proofData && (
                <div className="mb-6 border border-blue-300 rounded-lg overflow-hidden">
                  <div className="flex justify-between items-center p-3 bg-blue-100">
                    <h3 className="font-medium text-blue-800">Proof Generated:</h3>
                    <button
                      onClick={toggleDisplayMode}
                      className="text-sm text-blue-600 hover:text-blue-800 bg-white px-2 py-1 rounded border border-blue-300"
                    >
                      {displayMode === "basic" ? "Show Advanced" : "Show Basic"}
                    </button>
                  </div>

                  {displayMode === "basic" ? (
                    <div className="p-3 bg-white">
                      <p className="text-sm text-blue-700">Proof Type: Plonk</p>
                      <p className="text-sm text-blue-700">Curve Type: bn128</p>
                      <p className="text-sm text-blue-700">
                        Public Signals: {proofData.publicSignals.join(", ")}
                      </p>
                      <p className="text-sm text-blue-700 font-medium mt-2 text-center">
                        Result:{" "}
                        {proofData.publicSignals[0] === "1" ? (
                          <span className="text-green-600 bg-green-50 p-1 rounded border border-green-200">
                            Speed ≤ 120 km/h (Compliant)
                          </span>
                        ) : (
                          <span className="text-red-600 bg-red-50 p-1 rounded border border-red-200">
                            Speed {">"} 120 km/h (Violation)
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-white overflow-auto max-h-64">
                      <pre className="text-xs text-blue-700 whitespace-pre-wrap break-all">
                        {JSON.stringify(proofData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-blue-200 pt-6 mt-6">
                <h2 className="text-lg font-semibold mb-4 text-center text-blue-800">
                  Driving History
                </h2>
                {violationHistory.length === 0 ? (
                  <p className="text-blue-600 text-center">No Speed recorded</p>
                ) : (
                  <div className="space-y-3">
                    {violationHistory.map((violation, index) => (
                      <div
                        key={index}
                        className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-blue-700">
                              Event #{violation.count}
                            </p>
                            <p className="text-sm text-blue-600">
                              {new Date(violation.timestamp).toLocaleDateString()} at{" "}
                              {new Date(violation.timestamp).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-blue-500 truncate mt-1">
                              Tx: {violation.txHash.substring(0, 10)}...
                            </p>
                          </div>
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-300">
                            Insured
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
                <h4 className="text-sm font-medium mb-2 text-center text-blue-800">
                  How It Works:
                </h4>
                <ol className="text-sm text-blue-700 list-decimal pl-8 space-y-1">
                  <li>Enter your average vehicle&apos;s speed</li>
                  <li>Generate a zero-knowledge proof (ZKP) proving speed ≤ 120 km/h</li>
                  <li>Submit the ZKP to the blockchain for verification</li>
                  <li>Check if you&apos;re insured based on the proof</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeedVerificationApp;