import React, { createContext, useContext, useState, useCallback } from "react";

const FactoryContext = createContext(null);

export const FactoryProvider = ({ children }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const updateNodeAndNeighbors = useCallback((nodeId) => {
    // Implementation here, using nodes and edges from state
  }, []);

  return (
    <FactoryContext.Provider
      value={{ nodes, setNodes, edges, setEdges, updateNodeAndNeighbors }}
    >
      {children}
    </FactoryContext.Provider>
  );
};

export const useFactory = () => useContext(FactoryContext);
