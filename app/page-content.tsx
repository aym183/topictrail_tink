'use client'

import { Input } from "@/components/ui/input"
import { MainGraph } from "@/app/main-network"
import { useState, useEffect, useRef, useCallback } from "react"
import { BackendHandler } from "@/app/backend-handler"
import '@/app/styles/page.css';
import { event } from '../lib/gtag';

interface Node {
  id: string;
  label: string;
  // Add other node properties as needed
}

export default function Home() {
  const [showDiagram, setShowDiagram] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userInput, setUserInput] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [branchId, setBranchId] = useState('');
  const [treeRoot, setTreeRoot] = useState('');
  const [summary, setSummary] = useState('');
  const [academicSources, setAcademicSources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [topicSummary, setTopicSummary] = useState('');
  const graphRef = useRef(null);
  const [showDebugModal, setShowDebugModal] = useState(false);

  useEffect(() => {
    const checkBackendHealth = async () => {
      // Test connection first
      await BackendHandler.testBackendConnection();
      
      const isHealthy = await BackendHandler.checkHealth();
      setIsBackendHealthy(isHealthy);
      if (!isHealthy) {
        setErrorMessage('Backend is not running. Please start the backend server.');
        setShowDebugModal(true);
      } else {
        setErrorMessage('');
      }
    };

    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const [inputValue, setInputValue] = useState("");
  const [mounted, setMounted] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState(true);
  const [showSummaryBox, setShowSummaryBox] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [summaryContent, setSummaryContent] = useState("");
  const [showSourcesBox, setShowSourcesBox] = useState(false);
  const [sourcesContent, setSourcesContent] = useState<Array<{
    title: string;
    url: string;
    source: string;
    citations: number;
  }>>([]);
  const [sourcesSummary, setSourcesSummary] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ensure we're on the client side
  useEffect(() => {
    setMounted(true);
    
    const branchId = sessionStorage.getItem('branch_id');
    if (branchId) {
      const subscription = BackendHandler.subscribeToBranchChanges(branchId, (newNodes, newEdges) => {
        setNodes(newNodes as Node[]);
        setEdges(newEdges as Node[]);
      });

      // return () => {
      //   supabase.removeSubscription(subscription);
      // };
    }
  
  }, []);

  const drawStar = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Add glow effect
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'white';
    
    // Draw larger star
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow for performance
    ctx.shadowBlur = 0;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mounted || showDiagram) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create stars
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 0.5 + 0.1
    }));

    // Animation loop
    const animate = () => {
      if (!ctx || showDiagram) return;
      
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        drawStar(ctx, star.x, star.y);
        star.y = (star.y + star.speed) % canvas.height;
      });

      if (!showDiagram) {
        requestAnimationFrame(animate);
      }
    };

    animate();

    // Cleanup
    return () => {
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [mounted, showDiagram, drawStar]);

  const handleEnterPress = async (input: string) => {
    try {
      const response = await BackendHandler.processUserInput(input);
      if (response.success && response.data) {
        const branchId = response.data.branch_id;
        if (branchId) {
          const graphData = await BackendHandler.fetchNodesAndEdges(branchId);
          setNodes(graphData.nodes);
          setEdges(graphData.edges);
          setShowDiagram(true);
        }
      } else {
        console.error('Failed to process input:', response.error);
      }
    } catch (error) {
      console.error('Error processing input:', error);
    }
  };

  const handleNodeClick = (node: Node) => {
    setSelectedNodeId(node.id);
    setButtonsDisabled(false);
  };

  const handleSummaryButtonClick = async () => {
    setShowSummaryBox(true);
    setSummaryContent(""); // Clear previous content

    const selectedNode = nodes.find((node: Node) => node.id === selectedNodeId);
    const branchId = sessionStorage.getItem('branch_id');
    const root = sessionStorage.getItem('tree_root');

    if (selectedNode && branchId && root) {
      await BackendHandler.generateSummary(
        selectedNode.label,
        root,
        branchId,
        selectedNode.label,
        (chunk) => {
          const formattedChunk = chunk.replace(/\*\*(.*?)\*\*/g, '\n\n<strong>$1</strong>\n\n');
          setSummaryContent(prev => prev + formattedChunk);
        }
      );
    }
  };

  const handleCloseSummaryBox = () => {
    setShowSummaryBox(false);
  };

  const handleCloseSourcesBox = () => {
    setShowSourcesBox(false);
  };

  const handleDeepDiveButtonClick = async () => {
    if (!selectedNodeId) return;

    setShowSourcesBox(true);
    setSourcesContent([]); // Clear previous content
    setSourcesSummary(""); // Clear previous summary

    const selectedNode = nodes.find((node: Node) => node.id === selectedNodeId);
    const root = sessionStorage.getItem('tree_root');
    
    if (selectedNode && root) {
      console.log("Fetching academic sources for:", selectedNode.label);
      // First get the summary
      await BackendHandler.generateTopicSummary(selectedNode.label, root, (chunk) => {
        setSourcesSummary(prev => prev + chunk);
      });
      // Then get the sources
      await BackendHandler.fetchAcademicSources(selectedNode.label, root, (source) => {
        console.log("Received source:", source);
        if (source.error) {
          setSourcesContent([]);
        } else {
          setSourcesContent(prev => [...prev, source]);
        }
      });
    }
  };

  const handleCanvasClick = () => {
    setButtonsDisabled(true);
  };

  const handleExpandButtonClick = async () => {
    if (!selectedNodeId) {
      console.error('No node selected');
      return;
    }

    const selectedNode = nodes.find((node: Node) => node.id === selectedNodeId);
    const branchId = sessionStorage.getItem('branch_id');
    const root = sessionStorage.getItem('tree_root');
    
    console.log('Expanding node:', {
      selectedNode,
      branchId,
      root
    });

    if (!selectedNode || !branchId || !root) {
      console.error('Missing required data:', {
        hasSelectedNode: !!selectedNode,
        hasBranchId: !!branchId,
        hasRoot: !!root
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await BackendHandler.expandElement(
        branchId,
        selectedNode.id,
        selectedNode.label,
        root
      );

      if (response.success && response.data) {
        console.log('Expand successful:', response.data);
        const updatedGraph = await BackendHandler.fetchNodesAndEdges(branchId);
        setNodes(updatedGraph.nodes);
        setEdges(updatedGraph.edges);
      } else {
        console.error('Failed to expand:', response.error);
      }
    } catch (error) {
      console.error('Error expanding node:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugClick = async () => {
    const response = await fetch('https://totpictrail-backend-7d9b84224f41.herokuapp.com/ping');
    const data = await response.text();
    alert(`Response from backend: ${data}`);
  };

  const handleCloseDebugModal = () => {
    setShowDebugModal(false);
  };

  const handleEnterClick = () => {
    event({
      action: 'click',
      category: 'Button',
      label: 'Enter',
      value: 1,
    });
  };

  // Don't render anything until we're on the client side
  if (!mounted) return null;

  return (
    <div className="main-container relative w-screen h-screen bg-black text-white font-[family-name:var(--font-geist-sans)] dark cursor-grab">
      {/* Backend status message */}
      {errorMessage && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 text-center z-50">
          {errorMessage}
          <span 
            onClick={handleDebugClick} 
            className="cursor-pointer ml-2 inline-flex items-center"
            title="Click to test backend connection"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l-3-3m3 3l3-3" />
            </svg>
          </span>
        </div>
      )}

      {/* Debug Modal */}
      {showDebugModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-black max-w-2xl">
            <h2 className="text-lg font-bold mb-4">Backend Connection Debug</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Connection Details:</h3>
                <ul className="list-disc list-inside pl-4 space-y-2">
                  <li>Backend URL: <code className="bg-gray-100 px-2 py-1 rounded">{BackendHandler.getBaseUrl()}</code></li>
                  <li>Health Endpoint: <code className="bg-gray-100 px-2 py-1 rounded">{`${BackendHandler.getBaseUrl()}/health`}</code></li>
                  <li>Ping Endpoint: <code className="bg-gray-100 px-2 py-1 rounded">{`${BackendHandler.getBaseUrl()}/ping`}</code></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Troubleshooting Steps:</h3>
                <ol className="list-decimal list-inside pl-4 space-y-2">
                  <li>Check if the backend is running by clicking "Test Connection"</li>
                  <li>Verify that the backend URL is correct</li>
                  <li>Check browser console for detailed error messages</li>
                  <li>Ensure CORS is properly configured on the backend</li>
                </ol>
              </div>
              <div className="flex space-x-4 mt-6">
                <button 
                  onClick={() => window.open(`${BackendHandler.getBaseUrl()}/ping`, '_blank')}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Test Connection
                </button>
                <button 
                  onClick={handleCloseDebugModal}
                  className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showDiagram ? (
        <>
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            style={{ opacity: 0.5 }}
          />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
            <main className="items-center sm:items-start">
              <Input 
                placeholder="What do you want to learn about today?" 
                onEnterPress={() => {
                  handleEnterPress(inputValue);
                  handleEnterClick();
                }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </main>
          </div>
        </>
      ) : (
        <div className="w-screen h-screen">
        <MainGraph nodes={nodes} edges={edges} onNodeClick={handleNodeClick} onCanvasClick={handleCanvasClick} />
        {!showSummaryBox && !showSourcesBox && (
            <div className={`action-buttons absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4 flex gap-5 justify-center ${buttonsDisabled ? 'disabled' : ''}`}>
              <button className="summary-button action-button inline-flex items-center justify-center whitespace-wrap rounded-md text-[0.8rem] font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground w-40" disabled={buttonsDisabled} onClick={handleSummaryButtonClick}>
                Summarise
              </button>
              <button className="deep-dive-button action-button inline-flex items-center justify-center whitespace-wrap rounded-md text-[0.8rem] font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground w-40" disabled={buttonsDisabled} onClick={handleDeepDiveButtonClick}>
                Deep Dive 
              </button>
              <button className="expand-button action-button inline-flex items-center justify-center whitespace-wrap rounded-md text-[0.8rem] font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground w-40" disabled={buttonsDisabled} onClick={handleExpandButtonClick}>
                Expand
              </button>
            </div>
          )}
        {showSummaryBox && (
          <div className="summary-box" style={{ paddingTop: '10px' }}>
            <div className="summary-box-header" style={{ textAlign: 'right', position: 'sticky', top: '0', backgroundColor: 'black', zIndex: '1' }}>
              <svg className="cancel-button-summary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '35px', height: '35px', cursor: 'pointer' }} onClick={handleCloseSummaryBox}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div style={{ overflowY: 'auto', height: 'calc(80vh - 45px)' }}>
              <p dangerouslySetInnerHTML={{ __html: summaryContent }}></p>
            </div>
          </div>
        )}
        {showSourcesBox && (
          <div className="sources-box" style={{ paddingTop: '10px' }}>
            <div className="sources-box-header" style={{ textAlign: 'right', position: 'sticky', top: '0', backgroundColor: 'black', zIndex: '1', padding: '10px' }}>
              <svg className="cancel-button-sources" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '35px', height: '35px', cursor: 'pointer', position: 'absolute', right: '10px', top: '10px' }} onClick={handleCloseSourcesBox}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div style={{ overflowY: 'auto', height: 'calc(80vh - 45px)', padding: '20px' }}>
              {sourcesSummary && (
                <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', fontWeight: 'bold' }}>Topic Overview</h3>
                  <p style={{ lineHeight: '1.6' }}>{sourcesSummary}</p>
                </div>
              )}
              <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: 'bold' }}>Academic Sources</h2>
              {sourcesContent.length === 0 ? (
                <p>Loading academic sources...</p>
              ) : (
                <div className="sources-list">
                  {sourcesContent.map((source, index) => (
                    <div key={index} style={{ marginBottom: '20px', padding: '15px', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{source.title}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <p style={{ color: '#888' }}>Source: {source.source}</p>
                        <p style={{ color: '#888' }}>Citations: {(source.citations ?? 0).toLocaleString()}</p>
                      </div>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                        View Source
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}
      <style jsx>{`
        .summary-box, .sources-box {
          z-index: 9999;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70vw;
          height: 80vh;
          border-radius: 2.5%;
          background-color: black;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          display: ${showSummaryBox || showSourcesBox ? 'block' : 'none'};
          border: 2px solid rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  )
}
