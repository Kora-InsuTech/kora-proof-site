import { useState } from "react";
import "./index.css";

// Mock implementation of proof generation based on your sample output
const generateProof = async (speed) => {
  console.log(`Generating proof for speed: ${speed}`);
  // In production, this would call the actual proof generation
  // For demo purposes, returning a structure that matches your sample output
  return {
    A: [
      "14759074159402716056180867513112819598152649542429141579933772738441345110095",
      "17267532977396111415071868537454188430747842261513066722224497768664829095786",
      "1",
    ],
    B: [
      "6979412938977235754111312281648354979563178895453075025365712566448302328716",
      "6953810983959649880575714243781658111742685361957457346754618046812735540906",
      "1",
    ],
    C: [
      "3768259085044373003298479338997433243862293774399511660834306554214471807867",
      "13542676721203045012275382258699330076995604012736974085384353712099172389478",
      "1",
    ],
    Z: [
      "5696859014089785901980718281971000351038919132496723671340187517330296649256",
      "14365128738482723712122489861132345572311262383788438598815974620518991310484",
      "1",
    ],
    T1: [
      "387981979965310876662775852394284494379807805709947493005334782446554393390",
      "4271817982976895626993668996634080661752163341529004436119459878251485251466",
      "1",
    ],
    T2: [
      "9617983548662486495042324413907752367889798898607874728139431771736760720509",
      "7312143534847731012742671726038474227579993710472219644798764300254333847014",
      "1",
    ],
    T3: [
      "4605293418273050594214455802216044676089315639931655388770255760659835099589",
      "9956558564989581813366756064887647758812916913025507333215670686289259431588",
      "1",
    ],
    protocol: "plonk",
    curve: "bn128",
    publicSignals: ["1"],
  };
};

// Convert the proof to the format expected by the smart contract
const formatProofForContract = (proof) => {
  return [
    proof.A.slice(0, 2),
    [proof.B.slice(0, 2), proof.B.slice(0, 2)], // Duplicated as shown in your sample
    proof.C.slice(0, 2),
    proof.publicSignals,
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
  const [displayMode, setDisplayMode] = useState("basic"); // 'basic' or 'advanced'

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
        setIsConnected(true);
        setMessage("Wallet connected!");
        // Load violation history for this account
        loadViolationHistory(accounts[0]);
      } else {
        setMessage("Please install MetaMask to use this application");
      }
    } catch (error) {
      setMessage(`Error connecting wallet: ${error.message}`);
    }
  };

  // Load violation history from the contract
  const loadViolationHistory = async () => {
    // This would call your contract's function to get violation history
    // For demo purposes, we'll use mock data
    setViolationHistory([
      {
        timestamp: Date.now() - 86400000 * 7,
        count: 1,
        txHash:
          "0x3a83fc08e4d3fd8d9eeef3362734250218a426fb0dbaed1751172f600e7d6b98",
      },
      {
        timestamp: Date.now() - 86400000 * 3,
        count: 2,
        txHash:
          "0xb92c48253f4e1272945bb4c5c6a49f294c95da1022fccd4328cdc9611f055538",
      },
      {
        timestamp: Date.now() - 86400000 * 1,
        count: 3,
        txHash:
          "0x8b3c7b26b4c0f254db8a3aa61b3c0e797d6975b3de0bc6594feab77d45a272eb",
      },
    ]);
  };

  // Generate a proof for the current speed
  const handleGenerateProof = async () => {
    setIsLoading(true);
    setMessage("Generating zero-knowledge proof...");

    try {
      const proof = await generateProof(speed);
      setProofData(proof);
      setMessage(
        "Proof generated successfully! You can now submit it to the blockchain."
      );
    } catch (error) {
      setMessage(`Error generating proof: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit the proof to the blockchain
  const handleSubmitProof = async () => {
    if (!proofData) {
      setMessage("Please generate a proof first");
      return;
    }

    setIsLoading(true);
    setMessage("Submitting proof to blockchain...");

    try {
      // Format the proof for the contract
      formatProofForContract(proofData);

      // This would actually call your contract
      // For demo purposes, we'll simulate success
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock transaction hash (using the one from your sample)
      const mockTxHash =
        "0x3a83fc08e4d3fd8d9eeef3362734250218a426fb0dbaed1751172f600e7d6b98";
      setTxHash(mockTxHash);

      // Update violation history after successful submission
      const updatedHistory = [
        ...violationHistory,
        {
          timestamp: Date.now(),
          count:
            violationHistory.length > 0
              ? violationHistory[violationHistory.length - 1].count + 1
              : 1,
          txHash: mockTxHash,
        },
      ];
      setViolationHistory(updatedHistory);

      setMessage("Proof submitted and verified on-chain!");
    } catch (error) {
      setMessage(`Error submitting proof: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle between basic and advanced display modes
  const toggleDisplayMode = () => {
    setDisplayMode(displayMode === "basic" ? "advanced" : "basic");
  };

  return (
    <div className="flex flex-col items-center justify-center w-full bg-blue-900 min-h-screen p-4">
      <div className="text-center mb-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-white">
          Zero-Knowledge Speed Verification
        </h1>
        <p className="text-blue-300 mt-2">
          Verify speed violations without revealing actual speed data
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        {!isConnected ? (
          <div className="bg-white shadow-lg rounded-lg p-8 mx-auto max-w-md border-2 border-blue-200">
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md text-center w-full"
            >
              Connect Wallet
            </button>
            <p className="mt-4 text-blue-700 text-center">{message}</p>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden border-2 border-blue-200">
            <div className="bg-blue-800 text-white p-4 text-center">
              <h2 className="text-xl font-semibold">
                Zero-Knowledge Speed Verification
              </h2>
              <p className="text-blue-200 text-sm">
                Connected: {account.substring(0, 6)}...
                {account.substring(account.length - 4)}
              </p>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="block text-blue-800 mb-2 text-center font-medium">
                  Enter Vehicle Speed (km/h)
                </label>
                <input
                  type="text"
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
                  {speed > 80 ? (
                    <span className="text-red-600 font-medium">above</span>
                  ) : (
                    <span className="text-green-600 font-medium">within</span>
                  )}{" "}
                  the 80 km/h limit
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
                </div>
              )}

              {proofData && (
                <div className="mb-6 border border-blue-300 rounded-lg overflow-hidden">
                  <div className="flex justify-between items-center p-3 bg-blue-100">
                    <h3 className="font-medium text-blue-800">
                      Proof Generated:
                    </h3>
                    <button
                      onClick={toggleDisplayMode}
                      className="text-sm text-blue-600 hover:text-blue-800 bg-white px-2 py-1 rounded border border-blue-300"
                    >
                      {displayMode === "basic" ? "Show Advanced" : "Show Basic"}
                    </button>
                  </div>

                  {displayMode === "basic" ? (
                    <div className="p-3 bg-white">
                      <p className="text-sm text-blue-700">
                        Proof Type: {proofData.protocol}
                      </p>
                      <p className="text-sm text-blue-700">
                        Curve Type: {proofData.curve}
                      </p>
                      <p className="text-sm text-blue-700">
                        Public Signals: {proofData.publicSignals.join(", ")}
                      </p>
                      <p className="text-sm text-blue-700 font-medium mt-2 text-center">
                        Result:{" "}
                        {proofData.publicSignals[0] === "1" ? (
                          <span className="text-red-600 bg-red-50 p-1 rounded border border-red-200">
                            Speed &gt; 80 km/h (Violation)
                          </span>
                        ) : (
                          <span className="text-green-600 bg-green-50 p-1 rounded border border-green-200">
                            Speed ≤ 80 km/h (Compliant)
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
                  Violation History
                </h2>

                {violationHistory.length === 0 ? (
                  <p className="text-blue-600 text-center">
                    No violations recorded
                  </p>
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
                              Violation #{violation.count}
                            </p>
                            <p className="text-sm text-blue-600">
                              {new Date(
                                violation.timestamp
                              ).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(
                                violation.timestamp
                              ).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-blue-500 truncate mt-1">
                              Tx: {violation.txHash.substring(0, 10)}...
                            </p>
                          </div>
                          <div className="bg-blue-100 text-red-800 px-2 py-1 rounded border border-blue-300">
                            Speed &gt; 80 km/h
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
                  <li>Enter your vehicle's speed with the slider</li>
                  <li>
                    Generate a zero-knowledge proof (ZKP) that only proves if
                    speed {">"} 80 km/h
                  </li>
                  <li>Submit the ZKP to the blockchain for verification</li>
                  <li>
                    Your actual speed remains private - only the yes/no result
                    is recorded
                  </li>
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
