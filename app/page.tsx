'use client'
import { Input } from "@/components/ui/input"
import { MainGraph } from "@/app/main-network"
import { useState, useEffect, useRef, useCallback } from "react"
import { BackendHandler } from "@/app/backend-handler"
import '@/app/styles/page.css';

export default function Home() {
  const [showDiagram, setShowDiagram] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [mounted, setMounted] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
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
        setNodes(newNodes as any);
        setEdges(newEdges as any);
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

  const handleEnterPress = (fetchedNodes: any[], fetchedEdges: any[]) => {
    setNodes(fetchedNodes as any);
    setEdges(fetchedEdges as any);
    setShowDiagram(true);
  };

  const handleNodeClick = (node: any) => {
    setSelectedNodeId(node.id);
    setButtonsDisabled(false);
  };

  const handleSummaryButtonClick = async () => {
    setShowSummaryBox(true);
    setSummaryContent(""); // Clear previous content

    const selectedNode = nodes.find((node: any) => node.id === selectedNodeId);
    const branchId = sessionStorage.getItem('branch_id');
    const root = sessionStorage.getItem('tree_root');

    if (selectedNode && branchId && root) {
      await BackendHandler.generateSummary(
        (selectedNode as any).label,
        root,
        branchId,
        (selectedNode as any).label,
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

    const selectedNode = nodes.find((node: any) => node.id === selectedNodeId);
    const root = sessionStorage.getItem('tree_root');
    
    if (selectedNode && root) {
      console.log("Fetching academic sources for:", (selectedNode as any).label);
      // First get the summary
      await BackendHandler.generateTopicSummary((selectedNode as any).label, root, (chunk) => {
        setSourcesSummary(prev => prev + chunk);
      });
      // Then get the sources
      await BackendHandler.fetchAcademicSources((selectedNode as any).label, root, (source) => {
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
    if (!selectedNodeId) return;
  
    const selectedNode = nodes.find((node: any) => node.id === selectedNodeId);
    const branchId = sessionStorage.getItem('branch_id');
    const root = sessionStorage.getItem('tree_root');
    if (selectedNode && branchId && root) {
      const response = await BackendHandler.expandElement(branchId, (selectedNode as any).id, (selectedNode as any).label, root);
    }
  };

  // Don't render anything until we're on the client side
  if (!mounted) return null;

  return (
    <div className="main-container relative w-screen h-screen bg-black text-white font-[family-name:var(--font-geist-sans)] dark cursor-grab">
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
                onEnterPress={handleEnterPress}
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
