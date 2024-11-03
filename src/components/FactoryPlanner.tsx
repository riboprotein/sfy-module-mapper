import React, {
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
} from "react";
import ReactFlow, {
  addEdge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Connection,
  Edge,
  Handle,
  Position,
  ConnectionMode,
  ConnectionLineType,
  useReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, StyledBody, StyledAction } from "baseui/card";
import { Button } from "baseui/button";
import { Slider } from "baseui/slider";
import { useStyletron } from "baseui";
import { LabelSmall, HeadingXSmall } from "baseui/typography";
import { SIZE as ButtonSize, KIND as ButtonKind } from "baseui/button";
import { Input } from "baseui/input";
import { Select, TYPE } from "baseui/select";
import { validItems, getItemIcon, getItemName } from "../data/itemData";

const lightBlue = "rgb(66, 135, 245)";
// Types
interface ResourceIO {
  id: string;
  name: string;
  rate: number;
}

interface FactoryType {
  id: string;
  name: string;
  inputs: ResourceIO[];
  outputs: ResourceIO[];
}

interface FactoryNodeData {
  label: string;
  factoryType: FactoryType;
  scale: number;
  onScaleChange: (scale: number) => void;
  inputStatus: Record<string, boolean>;
  setSelectedFactory: (factoryId: string) => void;
}

interface FactoryNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: FactoryNodeData;
}

// Factory type definitions
const FACTORY_TYPES: Record<string, FactoryType> = {
  steel: {
    id: "steel",
    name: "Steel Factory",
    inputs: [{ id: "iron-ore", name: "Iron Ore", rate: 120 }],
    outputs: [
      { id: "steel-pipe", name: "Steel Pipe", rate: 80 },
      { id: "steel-beam", name: "Steel Beam", rate: 10 },
    ],
  },
  copper: {
    id: "copper",
    name: "Copper Factory",
    inputs: [{ id: "copper-ore", name: "Copper Ore", rate: 60 }],
    outputs: [
      { id: "copper-wire", name: "Copper Wire", rate: 120 },
      { id: "copper-sheet", name: "Copper Sheet", rate: 20 },
    ],
  },
} as const;

function createFactoryType(
  id: string,
  name: string,
  inputs: ResourceIO[],
  outputs: ResourceIO[],
): FactoryType {
  return { id, name, inputs, outputs };
}

const ResourceInput: React.FC<{
  resource: ResourceIO;
  onChange: (field: keyof ResourceIO, value: string | number) => void;
  onRemove: () => void;
}> = ({ resource, onChange, onRemove }) => {
  const [css, theme] = useStyletron();

  return (
    <div
      className={css({
        display: "flex",
        alignItems: "center",
        marginBottom: theme.sizing.scale300,
      })}
    >
      <div
        className={css({ flexGrow: "1", marginRight: theme.sizing.scale300 })}
      >
        <Select
          options={validItems.map((item) => ({
            id: item,
            label: getItemName(item),
          }))}
          value={[{ id: resource.id, label: getItemName(resource.id) }]}
          onChange={(params) => onChange("id", params.value[0].id as string)}
          onInputChange={(event) => {
            const matchingItem = validItems.find((item) =>
              getItemName(item)
                .toLowerCase()
                .includes(event.target.value.toLowerCase()),
            );
            if (matchingItem) {
              onChange("id", matchingItem);
              onChange("name", getItemName(matchingItem));
            }
          }}
          overrides={{
            Option: {
              props: {
                getItemLabel: (item: { id: string; label: string }) => {
                  const icon = getItemIcon(item.id);
                  return (
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {icon && (
                        <div
                          style={{
                            transform: "scale(0.5, 0.5)",
                            width: "64px",
                            height: "64px",
                            backgroundImage: "url(src/assets/sfy/icons.webp)",
                            backgroundPosition: icon.position,
                            marginRight: "8px",
                          }}
                        />
                      )}
                      {item.label}
                    </div>
                  );
                },
              },
            },
          }}
        />
      </div>
      <div
        className={css({
          flexGrow: "1",
          width: "80px",
          marginRight: theme.sizing.scale300,
          minWidth: "80px",
        })}
      >
        <Input
          value={resource.rate}
          onChange={(e) =>
            onChange("rate", Number((e.target as HTMLInputElement).value))
          }
          type="number"
          placeholder="Rate"
        />
      </div>
      <Button onClick={onRemove} kind="tertiary">
        -
      </Button>
    </div>
  );
};

interface FactoryTypeEditorProps {
  factoryType: FactoryType | null;
  onSave: (factoryType: FactoryType) => void;
  onClose: () => void;
}

const FactoryTypeEditor: React.FC<FactoryTypeEditorProps> = ({
  factoryType,
  onSave,
  onClose,
}) => {
  const [css, theme] = useStyletron();
  const [name, setName] = useState(factoryType?.name || "");
  const [inputs, setInputs] = useState<ResourceIO[]>(factoryType?.inputs || []);
  const [outputs, setOutputs] = useState<ResourceIO[]>(
    factoryType?.outputs || [],
  );

  const handleSave = () => {
    const newFactoryType: FactoryType = {
      id: factoryType?.id || `custom-${Date.now()}`,
      name,
      inputs,
      outputs,
    };
    onSave(newFactoryType);
  };

  const addInput = () => setInputs([...inputs, { id: "", name: "", rate: 0 }]);
  const addOutput = () =>
    setOutputs([...outputs, { id: "", name: "", rate: 0 }]);

  const updateResource = (
    index: number,
    field: keyof ResourceIO,
    value: string | number,
    isInput: boolean,
  ) => {
    const updater = isInput ? setInputs : setOutputs;
    updater((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
              name: field === "id" ? getItemName(value as string) : item.name,
            }
          : item,
      ),
    );
  };

  const removeResource = (index: number, isInput: boolean) => {
    const updater = isInput ? setInputs : setOutputs;
    updater((prev) => prev.filter((_, i) => i !== index));
  };

  const editorStyle = css({
    padding: theme.sizing.scale600,
    width: "300px",
    height: "100%",
    overflowY: "auto",
    backgroundColor: theme.colors.backgroundPrimary,
    boxShadow: theme.lighting.shadow600,
  });

  return (
    <div className={editorStyle}>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Factory Name"
      />

      <LabelSmall>Inputs</LabelSmall>
      {inputs.map((input, index) => (
        <ResourceInput
          key={index}
          resource={input}
          onChange={(field, value) => updateResource(index, field, value, true)}
          onRemove={() => removeResource(index, true)}
        />
      ))}
      <Button onClick={addInput} kind="secondary" startEnhancer={() => "+"}>
        Add Input
      </Button>

      <LabelSmall>Outputs</LabelSmall>
      {outputs.map((output, index) => (
        <ResourceInput
          key={index}
          resource={output}
          onChange={(field, value) =>
            updateResource(index, field, value, false)
          }
          onRemove={() => removeResource(index, false)}
        />
      ))}
      <Button onClick={addOutput} kind="secondary" startEnhancer={() => "+"}>
        Add Output
      </Button>

      <div className={css({ marginTop: theme.sizing.scale600 })}>
        <Button onClick={handleSave}>Save</Button>
        <Button onClick={onClose} kind="secondary">
          Cancel
        </Button>
      </div>
    </div>
  );
};

type FactoryNodeProps = {
  id: string;
  data: FactoryNodeData;
};

const FactoryNode: React.FC<FactoryNodeProps> = ({ id, data }) => {
  const [css, theme] = useStyletron();
  const { factoryType, scale, onScaleChange, label, setSelectedFactory } = data;
  const { updateNodeAndNeighbors } = useFactory();

  useEffect(() => {
    console.log("calling effect");
    updateNodeAndNeighbors(id);
  }, [scale, id]);

  const scaleContainer = css({
    display: "flex",
    alignItems: "center",
    gap: theme.sizing.scale300,
    marginBottom: theme.sizing.scale600,
  });

  const nodeContainer = css({
    width: "300px",
    position: "relative", // Add this
    padding: "10px", // Add some padding to make room for handles
  });

  const itemContainer = css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "40px",
    position: "relative",
  });

  const iconStyle = css({
    transform: "scale(0.5, 0.5)",
    width: "64px",
    height: "64px",
    backgroundImage: "url(src/assets/sfy/icons.webp)",
    // marginRight: "5px",
    backgroundSize: "896px 960px",
  });

  const handleStyle = css({
    zIndex: 1,
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: lightBlue,
    cursor: "pointer",
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    "&:hover": {
      background: theme.colors.primary600,
    },
  });

  const handleNodeClick = useCallback(() => {
    console.log("got click", data.factoryType.id);
    setSelectedFactory(data.factoryType.id);
  }, [data.factoryType.id, setSelectedFactory]);

  return (
    <div className={nodeContainer} onClick={handleNodeClick}>
      <Card>
        <StyledBody>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: theme.sizing.scale300,
            }}
          >
            <HeadingXSmall marginTop="0" marginBottom="0">
              {factoryType.name}
            </HeadingXSmall>

            <div className={scaleContainer} data-nodrag>
              <Button
                onClick={() => onScaleChange(Math.max(1, scale - 1))}
                size={ButtonSize.mini}
                kind={ButtonKind.secondary}
                disabled={scale === 1}
              >
                -
              </Button>
              <LabelSmall>{scale}x</LabelSmall>
              <Button
                onClick={() => onScaleChange(scale + 1)}
                size={ButtonSize.mini}
                kind={ButtonKind.secondary}
              >
                +
              </Button>
            </div>
          </div>

          <LabelSmall>Inputs</LabelSmall>
          {factoryType.inputs.map((input, index) => (
            <div key={input.id} className={itemContainer}>
              <Handle
                className={handleStyle}
                type="target"
                position={Position.Left}
                id={input.id}
                style={{
                  left: "-20px",
                  background: data.inputStatus?.[input.id] ? lightBlue : "red",
                }}
              />
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  className={iconStyle}
                  style={{
                    backgroundPosition: getItemIcon(input.id)?.position,
                  }}
                />
                <span
                  style={{
                    color: data.inputStatus?.[input.id] ? "inherit" : "red",
                  }}
                >
                  {input.name}
                </span>
              </div>
              <span>{(input.rate * scale).toFixed(1)}/m</span>
            </div>
          ))}

          <LabelSmall marginTop="scale600">Outputs</LabelSmall>
          {factoryType.outputs.map((output, index) => (
            <div key={output.id} className={itemContainer}>
              <Handle
                className={handleStyle}
                type="source"
                position={Position.Right}
                id={output.id}
                style={{ right: "-20px" }}
              />
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  className={iconStyle}
                  style={{
                    backgroundPosition: getItemIcon(output.id)?.position,
                  }}
                />
                <span>{output.name}</span>
              </div>
              <span>{(output.rate * scale).toFixed(1)}/m</span>
            </div>
          ))}
        </StyledBody>
      </Card>
    </div>
  );
};
// Main Component
//
//
type FactoryContextType = {
  updateNodeAndNeighbors: (nodeId: string) => void;
};
const FactoryContext = createContext<FactoryContextType>();

export const useFactory = () => useContext(FactoryContext);

const nodeTypes: NodeTypes = {
  factory: FactoryNode,
};

export const FactoryPlannerContent = () => {
  const [css, theme] = useStyletron();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeCount, setNodeCount] = useState(0);
  const [selectedFactory, setSelectedFactory] = useState<string>("steel");

  const [isInitialized, setIsInitialized] = useState(false);
  const [customFactoryTypes, setCustomFactoryTypes] = useState<
    Record<string, FactoryType>
  >({});
  const [editingFactoryType, setEditingFactoryType] =
    useState<FactoryType | null>(null);

  const allFactoryTypes = { ...FACTORY_TYPES, ...customFactoryTypes };
  // Load data on component mount
  useEffect(() => {
    if (!isInitialized) {
      const savedData = localStorage.getItem("factoryPlannerData");
      if (savedData) {
        const { nodes, edges, nodeCount } = JSON.parse(savedData);
        console.log("Loading saved data:", { nodes, edges, nodeCount });
        const restoredNodes = nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            onScaleChange: (newScale: number) =>
              handleScaleChange(node.id, newScale),
            updateNodeAndNeighbors: updateNodeAndNeighbors,
            setSelectedFactory,
          },
        }));
        setNodes(restoredNodes);
        setEdges(edges);
        setNodeCount(nodeCount);

        const savedCustomTypes = localStorage.getItem("customFactoryTypes");
        if (savedCustomTypes) {
          setCustomFactoryTypes(JSON.parse(savedCustomTypes));
        }
        setIsInitialized(true);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      const saveToLocalStorage = () => {
        const flow = {
          nodes,
          edges,
          nodeCount,
        };
        localStorage.setItem("factoryPlannerData", JSON.stringify(flow));
        localStorage.setItem(
          "customFactoryTypes",
          JSON.stringify(customFactoryTypes),
        );
      };

      saveToLocalStorage();
    }
  }, [isInitialized, nodes, edges, nodeCount, customFactoryTypes]);

  const handleSaveFactoryType = (factoryType: FactoryType) => {
    setCustomFactoryTypes((prev) => ({
      ...prev,
      [factoryType.id]: factoryType,
    }));
    setSelectedFactory(factoryType.id);
    setEditingFactoryType(null);
  };

  const handleScaleChange = useCallback(
    (nodeId: string, newScale: number) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                scale: newScale,
              },
            };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  const checkNodeStatus = useCallback(
    (node: FactoryNode, currentEdges: Edge[]) => {
      const { factoryType, scale } = node.data;
      const inputStatus = factoryType.inputs.reduce(
        (acc, input) => {
          const incomingEdges = currentEdges.filter(
            (e) => e.target === node.id && e.targetHandle === input.id,
          );
          const totalIncoming = incomingEdges.reduce((sum, edge) => {
            const sourceNode = nodes.find(
              (n) => n.id === edge.source,
            ) as FactoryNode;
            const output = sourceNode.data.factoryType.outputs.find(
              (o) => o.id === edge.sourceHandle,
            );
            return sum + (output?.rate ?? 0) * sourceNode.data.scale;
          }, 0);
          acc[input.id] = totalIncoming >= input.rate * scale;
          return acc;
        },
        {} as Record<string, boolean>,
      );

      return {
        ...node,
        data: {
          ...node.data,
          inputStatus,
        },
      };
    },
    [nodes],
  );

  const updateNodeAndNeighbors = useCallback(
    (nodeId: string, currentEdges?: Edge[]) => {
      const edgesToUse = currentEdges || edges;
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const updatedNode = checkNodeStatus(node, edgesToUse);

      setNodes((currentNodes) =>
        currentNodes.map((n) => (n.id === nodeId ? updatedNode : n)),
      );

      // Find and update connected nodes
      const connectedNodeIds = new Set(
        edgesToUse.filter((e) => e.source === nodeId).map((e) => e.target),
      );

      connectedNodeIds.forEach((connectedId) => {
        const connectedNode = nodes.find((n) => n.id === connectedId);
        if (connectedNode) {
          const updatedConnectedNode = checkNodeStatus(
            connectedNode,
            edgesToUse,
          );
          setNodes((currentNodes) =>
            currentNodes.map((n) =>
              n.id === connectedId ? updatedConnectedNode : n,
            ),
          );
        }
      });
    },
    [nodes, edges, checkNodeStatus, setNodes],
  );

  const handleConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        setEdges((eds) => {
          const newEdges = addEdge(
            { ...params, animated: false, style: { stroke: lightBlue } },
            eds,
          );
          // Use setTimeout to ensure this runs after the state update
          setTimeout(() => {
            updateNodeAndNeighbors(params.target, newEdges);
          }, 0);
          return newEdges;
        });
      }
    },
    [setEdges, updateNodeAndNeighbors],
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      setEdges((eds) => {
        const newEdges = eds.filter((e) => e.id !== edge.id);
        // Use setTimeout to ensure this runs after the state update
        setTimeout(() => {
          updateNodeAndNeighbors(edge.source, newEdges);
          updateNodeAndNeighbors(edge.target, newEdges);
        }, 0);
        return newEdges;
      });
    },
    [setEdges, updateNodeAndNeighbors],
  );

  useEffect(() => {
    // Find all unique node IDs involved in the edges
    const affectedNodeIds = new Set(
      edges.flatMap((edge) => [edge.source, edge.target]),
    );

    // Update all affected nodes
    affectedNodeIds.forEach((nodeId) => {
      updateNodeAndNeighbors(nodeId);
    });
  }, [edges, updateNodeAndNeighbors]);

  const addFactory = () => {
    const factoryType = allFactoryTypes[selectedFactory];
    const newCount = nodeCount + 1;
    const nodeId = `factory-${newCount}`;

    const newNode: FactoryNode = {
      id: nodeId,
      type: "factory",
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: `${factoryType.name} #${newCount}`, // Add number to label
        factoryType: factoryType,
        scale: 1,
        onScaleChange: (newScale: number) =>
          handleScaleChange(nodeId, newScale),
        updateNodeAndNeighbors: updateNodeAndNeighbors,
        inputStatus: {},
        setSelectedFactory,
      },
    };

    setNodes((nodes) => [...nodes, newNode]);
    setNodeCount(newCount); // Increment our counter
  };

  const controlsStyle = css({
    position: "absolute",
    bottom: theme.sizing.scale800,
    right: theme.sizing.scale800,
    zIndex: 1,
    display: "flex",
    gap: theme.sizing.scale300,
  });

  return (
    <FactoryContext.Provider value={{ updateNodeAndNeighbors }}>
      <div style={{ width: "100vw", height: "100vh", display: "flex" }}>
        <div style={{ flex: 1 }}>
          <ReactFlow
            className="dark-theme"
            defaultEdgeOptions={{
              style: { strokeWidth: 3, stroke: lightBlue },
              type: ConnectionLineType.SimpleBezier,
              animated: true,
            }}
            nodes={nodes}
            edges={edges}
            onEdgeClick={onEdgeClick}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            nodeTypes={nodeTypes}
            defaultViewport={{
              x: 0,
              y: 0,
              zoom: 0.25,
            }}
            fitView
            minZoom={0.01}
            connectOnClick={true}
            connectionMode={ConnectionMode.Strict}
            connectionLineType={ConnectionLineType.SimpleBezier}
            connectionLineStyle={{ strokeWidth: 3 }}
          >
            <Background
              color="#aaa"
              gap={50}
              size={4}
              variant={BackgroundVariant.Dots}
            />
            <Controls />
          </ReactFlow>

          <div className={controlsStyle}>
            <Select
              options={[
                ...Object.entries(FACTORY_TYPES).map(([key, value]) => ({
                  id: key,
                  label: value.name,
                })),
                ...Object.entries(customFactoryTypes).map(([key, value]) => ({
                  id: key,
                  label: value.name,
                })),
              ]}
              value={[
                {
                  id: selectedFactory,
                  label: allFactoryTypes[selectedFactory].name,
                },
              ]}
              onChange={({ value }) => setSelectedFactory(value[0].id)}
              clearable={false}
            />
            <Button onClick={addFactory}>Add Factory</Button>
            <Button
              onClick={() => {
                const newId = `custom-${Date.now()}`;
                setEditingFactoryType({
                  id: newId,
                  name: "",
                  inputs: [],
                  outputs: [],
                });
              }}
            >
              New Factory Type
            </Button>
            <Button
              onClick={() =>
                setEditingFactoryType(allFactoryTypes[selectedFactory])
              }
            >
              Edit Factory Type
            </Button>
          </div>
        </div>
        {editingFactoryType && (
          <FactoryTypeEditor
            factoryType={editingFactoryType}
            onSave={handleSaveFactoryType}
            onClose={() => setEditingFactoryType(null)}
          />
        )}
      </div>
    </FactoryContext.Provider>
  );
};

export const FactoryPlanner = () => (
  <ReactFlowProvider>
    <FactoryPlannerContent />
  </ReactFlowProvider>
);
