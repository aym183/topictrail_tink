'use client'
import { Input } from "@/components/ui/input"
import { MainGraph } from "@/app/main-network"
import { useState, useEffect } from "react"
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <main className="items-center sm:items-start">
            <Input 
              placeholder="What do you want to learn about today?" 
              onEnterPress={handleEnterPress}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </main>
        </div>
      ) : (
        <div className="w-screen h-screen">
        <MainGraph nodes={nodes} edges={edges} onNodeClick={handleNodeClick} onCanvasClick={handleCanvasClick} />
        {!showSummaryBox && (
            <div className={`action-buttons absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4 flex gap-5 justify-center ${buttonsDisabled ? 'disabled' : ''}`}>
              <button className="summary-button action-button inline-flex items-center justify-center whitespace-wrap rounded-md text-[0.8rem] font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground w-40" disabled={buttonsDisabled} onClick={handleSummaryButtonClick}>
                Summarise
              </button>
              <button className="deep-dive-button action-button inline-flex items-center justify-center whitespace-wrap rounded-md text-[0.8rem] font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground w-40" disabled={buttonsDisabled}>
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
      </div>
      )}
      <style jsx>{`
        .summary-box {
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
          display: ${showSummaryBox ? 'block' : 'none'};
          border: 2px solid rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  )
}
