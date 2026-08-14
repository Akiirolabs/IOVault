import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { ProjectColumnType, ProjectFlowchart, ProjectMindmap, ProjectTable } from "./model";

const id = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`;

function FloatingMenu({ anchor, label, onClose, children }: { anchor: HTMLButtonElement; label: string; onClose: () => void; children: ReactNode }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const [position, setPosition] = useState({ left: 8, top: 8, visibility: "hidden" as "hidden" | "visible" });
  closeRef.current = onClose;
  const place = () => {
    const menu = menuRef.current;
    if (!menu || !anchor.isConnected) return closeRef.current();
    const bounds = anchor.getBoundingClientRect();
    const width = menu.offsetWidth || 176;
    const height = menu.offsetHeight || 180;
    const left = Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8));
    const below = bounds.bottom + 6;
    const top = below + height <= window.innerHeight - 8 ? below : Math.max(8, bounds.top - height - 6);
    setPosition({ left, top, visibility: "visible" });
  };
  useLayoutEffect(place, [anchor]);
  useEffect(() => {
    const dismiss = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node) || anchor.contains(event.target as Node)) return;
      closeRef.current();
    };
    const keyboard = (event: KeyboardEvent) => {
      const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([disabled]), button:not([disabled]), input:not([disabled])') ?? []);
      if (event.key === "Escape") {
        closeRef.current();
        anchor.focus();
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) || !items.length) return;
      event.preventDefault();
      const current = items.indexOf(document.activeElement as HTMLElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (current + 1 + items.length) % items.length : (current - 1 + items.length) % items.length;
      items[next]?.focus();
    };
    document.addEventListener("mousedown", dismiss);
    document.addEventListener("keydown", keyboard);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>("button, input")?.focus());
    return () => { document.removeEventListener("mousedown", dismiss); document.removeEventListener("keydown", keyboard); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [anchor]);
  return createPortal(<div ref={menuRef} className="project-node-floating-menu" role="menu" aria-label={label} style={position}>{children}</div>, document.body);
}

export function ProjectTableEditor({ table, onChange }: { table: ProjectTable; onChange: (table: ProjectTable) => void }) {
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [columnMenuId, setColumnMenuId] = useState("");
  const [rowMenuId, setRowMenuId] = useState("");
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const [rowMenuAnchor, setRowMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const [selectOptionsDraft, setSelectOptionsDraft] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<ProjectColumnType>("text");
  const [options, setOptions] = useState("");
  const updateCell = (rowId: string, columnId: string, value: string | boolean) => onChange({ ...table, rows: table.rows.map((row) => row.id === rowId ? { ...row, cells: { ...row.cells, [columnId]: value } } : row) });
  const deleteColumn = (columnId: string) => {
    if (table.columns.length === 1 || !window.confirm("Delete this column and its values?")) return;
    onChange({ columns: table.columns.filter((column) => column.id !== columnId), rows: table.rows.map((row) => { const cells = { ...row.cells }; delete cells[columnId]; return { ...row, cells }; }) });
  };
  const convertValue = (value: string | boolean | undefined, nextType: ProjectColumnType, allowed: string[]) => {
    if (nextType === "checkbox") return value === true || value === "true";
    const text = value === undefined || value === false ? "" : String(value);
    if (nextType === "number") return text && Number.isFinite(Number(text)) ? text : "";
    if (nextType === "date") return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
    if (nextType === "select") return allowed.includes(text) ? text : "";
    return text;
  };
  const changeColumnType = (columnId: string, nextType: ProjectColumnType) => {
    const column = table.columns.find((item) => item.id === columnId);
    if (!column || column.type === nextType) return;
    if (!window.confirm(`Change ${column.name} from ${column.type} to ${nextType}? Incompatible values will be cleared.`)) return;
    const allowed = nextType === "select" ? (column.options || []) : [];
    onChange({
      columns: table.columns.map((item) => item.id === columnId ? { ...item, type: nextType, ...(nextType === "select" ? { options: item.options || [] } : { options: undefined }) } : item),
      rows: table.rows.map((row) => ({ ...row, cells: { ...row.cells, [columnId]: convertValue(row.cells[columnId], nextType, allowed) } })),
    });
    setColumnMenuId("");
  };
  const menuColumn = table.columns.find((column) => column.id === columnMenuId);
  const menuRowIndex = table.rows.findIndex((row) => row.id === rowMenuId);
  const menuRow = table.rows[menuRowIndex];
  const saveSelectOptions = () => {
    if (!menuColumn) return;
    const next = [...new Set(selectOptionsDraft.split(",").map((item) => item.trim()).filter(Boolean))];
    const removedValues = table.rows.some((row) => { const value = String(row.cells[menuColumn.id] ?? ""); return value && !next.includes(value); });
    if (removedValues && !window.confirm("Remove these options? Values using removed options will be cleared.")) return;
    onChange({
      columns: table.columns.map((column) => column.id === menuColumn.id ? { ...column, options: next } : column),
      rows: table.rows.map((row) => { const value = String(row.cells[menuColumn.id] ?? ""); return value && !next.includes(value) ? { ...row, cells: { ...row.cells, [menuColumn.id]: "" } } : row; }),
    });
    setColumnMenuId("");
  };
  return <section className="project-mode-surface project-table-mode" aria-label="Project table">
    {menuColumn && columnMenuAnchor && <FloatingMenu anchor={columnMenuAnchor} label={`${menuColumn.name} property options`} onClose={() => setColumnMenuId("")}>
      <strong>Property type</strong>
      {(["text", "number", "date", "checkbox", "select"] as const).map((item) => <button type="button" role="menuitemradio" aria-checked={menuColumn.type === item} key={item} onClick={() => changeColumnType(menuColumn.id, item)}>{item}</button>)}
      {menuColumn.type === "select" && <><label>Select options<input aria-label={`${menuColumn.name} select options`} value={selectOptionsDraft} onChange={(event) => setSelectOptionsDraft(event.target.value)} /></label><button type="button" role="menuitem" onClick={saveSelectOptions}>Save options</button></>}
      <button type="button" role="menuitem" className="project-delete" disabled={table.columns.length === 1} onClick={() => { deleteColumn(menuColumn.id); setColumnMenuId(""); }}>Delete property</button>
    </FloatingMenu>}
    {menuRow && rowMenuAnchor && <FloatingMenu anchor={rowMenuAnchor} label={`Project row ${menuRowIndex + 1} options`} onClose={() => setRowMenuId("")}>
      <button type="button" role="menuitem" onClick={() => { const copy = { id: id("row"), cells: { ...menuRow.cells } }; onChange({ ...table, rows: [...table.rows.slice(0, menuRowIndex + 1), copy, ...table.rows.slice(menuRowIndex + 1)] }); setRowMenuId(""); }}>Duplicate row</button>
      <button type="button" role="menuitem" className="project-delete" onClick={() => { if (window.confirm("Delete this row?")) onChange({ ...table, rows: table.rows.filter((item) => item.id !== menuRow.id) }); setRowMenuId(""); }}>Delete row</button>
    </FloatingMenu>}
    <header><div><h3>Table</h3><span className="project-table-count">{table.rows.length} rows · {table.columns.length} properties</span></div><div><button type="button" onClick={() => onChange({ ...table, rows: [...table.rows, { id: id("row"), cells: {} }] })}>+ New row</button><button type="button" aria-expanded={isAddingColumn} onClick={() => setIsAddingColumn((value) => !value)}>+ Property</button></div></header>
    {isAddingColumn && <form className="project-table-column-form" onSubmit={(event) => { event.preventDefault(); const trimmed = name.trim(); if (!trimmed) return; onChange({ ...table, columns: [...table.columns, { id: id("column"), name: trimmed, type, ...(type === "select" ? { options: options.split(",").map((item) => item.trim()).filter(Boolean) } : {}) }] }); setName(""); setOptions(""); setIsAddingColumn(false); }}>
      <input aria-label="New project column name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Column name" />
      <select aria-label="New project column type" value={type} onChange={(event) => setType(event.target.value as ProjectColumnType)}>{(["text", "number", "date", "checkbox", "select"] as const).map((item) => <option key={item} value={item}>{item}</option>)}</select>
      {type === "select" && <input aria-label="Project select options" value={options} onChange={(event) => setOptions(event.target.value)} placeholder="Todo, Doing, Done" />}
      <button type="submit" disabled={!name.trim()}>Add column</button>
    </form>}
    <div className="project-table-scroll"><table><thead><tr>{table.columns.map((column) => <th key={column.id}><div className="project-property-head"><input aria-label={`Project column ${column.name}`} value={column.name} onChange={(event) => onChange({ ...table, columns: table.columns.map((item) => item.id === column.id ? { ...item, name: event.target.value } : item) })} /><span>{column.type}</span><button type="button" aria-label={`${column.name} property menu`} aria-expanded={columnMenuId === column.id} onClick={(event) => { setRowMenuId(""); setColumnMenuAnchor(event.currentTarget); setSelectOptionsDraft((column.options || []).join(", ")); setColumnMenuId((current) => current === column.id ? "" : column.id); }}>•••</button></div></th>)}<th aria-label="Row actions" /></tr></thead><tbody>{table.rows.map((row, rowIndex) => <tr key={row.id}>{table.columns.map((column) => <td key={column.id}>{column.type === "checkbox" ? <input type="checkbox" aria-label={`${column.name} row ${rowIndex + 1}`} checked={row.cells[column.id] === true} onChange={(event) => updateCell(row.id, column.id, event.target.checked)} /> : column.type === "select" ? <select aria-label={`${column.name} row ${rowIndex + 1}`} value={String(row.cells[column.id] ?? "")} onChange={(event) => updateCell(row.id, column.id, event.target.value)}><option value="">Select…</option>{column.options?.map((option) => <option key={option}>{option}</option>)}</select> : <input type={column.type} aria-label={`${column.name} row ${rowIndex + 1}`} value={String(row.cells[column.id] ?? "")} onChange={(event) => updateCell(row.id, column.id, event.target.value)} />}</td>)}<td className="project-row-actions"><button type="button" aria-label={`Project row ${rowIndex + 1} menu`} aria-expanded={rowMenuId === row.id} onClick={(event) => { setColumnMenuId(""); setRowMenuAnchor(event.currentTarget); setRowMenuId((current) => current === row.id ? "" : row.id); }}>•••</button></td></tr>)}</tbody></table></div>
  </section>;
}

export function ProjectFlowchartEditor({ flowchart, onChange }: { flowchart: ProjectFlowchart; onChange: (flowchart: ProjectFlowchart) => void }) {
  const [source, setSource] = useState("");
  const [menuId, setMenuId] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const [descriptionId, setDescriptionId] = useState("");
  const [openNodeId, setOpenNodeId] = useState("");
  const gesture = useRef<{ id: string; mode: "move" | "resize"; element: HTMLElement; startX: number; startY: number; x: number; y: number; width: number; height: number } | null>(null);
  const nodeIds = new Set(flowchart.nodes.map((node) => node.id));
  const edges = flowchart.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  const menuNode = flowchart.nodes.find((node) => node.id === menuId);
  const removeNode = (nodeId: string) => onChange({ ...flowchart, nodes: flowchart.nodes.filter((node) => node.id !== nodeId), edges: flowchart.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId) });
  const updateGesture = (clientX: number, clientY: number) => {
    const active = gesture.current;
    if (!active) return;
    const dx = (clientX - active.startX) / flowchart.zoom;
    const dy = (clientY - active.startY) / flowchart.zoom;
    if (active.mode === "move") {
      active.element.style.left = `${Math.max(0, active.x + dx)}px`;
      active.element.style.top = `${Math.max(0, active.y + dy)}px`;
    } else {
      active.element.style.width = `${Math.max(180, Math.min(520, active.width + dx))}px`;
      active.element.style.height = `${Math.max(100, Math.min(320, active.height + dy))}px`;
    }
  };
  const finishGesture = (clientX: number, clientY: number) => {
    const active = gesture.current;
    if (!active) return;
    const dx = (clientX - active.startX) / flowchart.zoom;
    const dy = (clientY - active.startY) / flowchart.zoom;
    onChange({ ...flowchart, nodes: flowchart.nodes.map((node) => node.id !== active.id ? node : active.mode === "move"
      ? { ...node, x: Math.max(0, active.x + dx), y: Math.max(0, active.y + dy) }
      : { ...node, width: Math.max(180, Math.min(520, active.width + dx)), height: Math.max(100, Math.min(320, active.height + dy)) }) });
    gesture.current = null;
  };
  return <section className="project-mode-surface" aria-label="Project flowchart">
    {menuNode && menuAnchor && <FloatingMenu anchor={menuAnchor} label={`${menuNode.label} options`} onClose={() => setMenuId("")}><button type="button" role="menuitem" onClick={() => { setMenuId(""); setOpenNodeId(""); setDescriptionId(menuNode.id); }}>Description</button><button type="button" role="menuitem" onClick={() => { setMenuId(""); setDescriptionId(""); setOpenNodeId(menuNode.id); }}>Open page</button><button type="button" role="menuitem" aria-label={`Connect ${menuNode.label}`} className="project-node-connect" onClick={() => { if (!source) setSource(menuNode.id); else { if (source !== menuNode.id && !edges.some((edge) => edge.source === source && edge.target === menuNode.id)) onChange({ ...flowchart, edges: [...edges, { id: id("edge"), source, target: menuNode.id, label: "" }] }); setSource(""); } setMenuId(""); }}>{source === menuNode.id ? "Selected" : "Connect"}</button><label>Color<input type="color" aria-label={`${menuNode.label} color`} value={menuNode.color} onChange={(event) => onChange({ ...flowchart, nodes: flowchart.nodes.map((item) => item.id === menuNode.id ? { ...item, color: event.target.value } : item) })} /></label><button type="button" role="menuitem" className="project-delete" aria-label={`Delete ${menuNode.label}`} onClick={() => { removeNode(menuNode.id); setMenuId(""); }}>Delete</button></FloatingMenu>}
    <header><h3>Flowchart</h3><div><button type="button" onClick={() => onChange({ ...flowchart, nodes: [...flowchart.nodes, { id: id("node"), label: `Node ${flowchart.nodes.length + 1}`, x: 40 + flowchart.nodes.length * 45, y: 50 + flowchart.nodes.length * 35, width: 304, height: 112, color: "#38bdf8" }] })}>+ Node</button><button type="button" onClick={() => onChange({ ...flowchart, zoom: Math.max(0.5, flowchart.zoom - 0.1) })}>−</button><button type="button" onClick={() => onChange({ ...flowchart, zoom: Math.min(1.75, flowchart.zoom + 0.1) })}>+</button><button type="button" onClick={() => onChange({ ...flowchart, zoom: 1 })}>Fit</button></div></header>
    <p className="project-map-hint">Type inside a rectangle, then click Connect on two nodes to draw an arrow.</p>
    <div className="project-flow-canvas" aria-label="Flowchart canvas"><div style={{ transform: `scale(${flowchart.zoom})` }}>{edges.map((edge) => { const from = flowchart.nodes.find((node) => node.id === edge.source)!; const to = flowchart.nodes.find((node) => node.id === edge.target)!; const fromX = from.x + from.width / 2, fromY = from.y + from.height / 2, toX = to.x + to.width / 2, toY = to.y + to.height / 2, width = Math.hypot(toX - fromX, toY - fromY), angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI; return <button type="button" className="project-flow-edge" key={edge.id} aria-label={`Delete connection ${from.label} to ${to.label}`} style={{ left: fromX, top: fromY, width, transform: `rotate(${angle}deg)` }} onClick={() => onChange({ ...flowchart, edges: edges.filter((item) => item.id !== edge.id) })} />; })}{flowchart.nodes.map((node) => <article key={node.id} className={`project-flow-node ${source === node.id ? "connecting" : ""}`} style={{ left: node.x, top: node.y, width: node.width, height: node.height, borderColor: node.color }} onPointerDown={(event) => { if ((event.target as HTMLElement).closest("input, button, label, textarea")) return; event.currentTarget.setPointerCapture(event.pointerId); gesture.current = { id: node.id, mode: "move", element: event.currentTarget, startX: event.clientX, startY: event.clientY, x: node.x, y: node.y, width: node.width, height: node.height }; }} onPointerMove={(event) => updateGesture(event.clientX, event.clientY)} onPointerUp={(event) => finishGesture(event.clientX, event.clientY)}><input aria-label={`${node.label} label`} value={node.label} placeholder="Type inside this node…" onChange={(event) => onChange({ ...flowchart, nodes: flowchart.nodes.map((item) => item.id === node.id ? { ...item, label: event.target.value } : item) })} /><div className="project-node-options"><button type="button" className="project-node-options-trigger" aria-label={`Options for ${node.label}`} aria-expanded={menuId === node.id} onClick={(event) => { setDescriptionId(""); setOpenNodeId(""); setMenuAnchor(event.currentTarget); setMenuId((current) => current === node.id ? "" : node.id); }}>•••</button></div>{descriptionId === node.id && <div className="project-node-description-popover"><textarea autoFocus aria-label={`${node.label} description`} value={node.pageText ?? ""} placeholder="Add a description…" onChange={(event) => onChange({ ...flowchart, nodes: flowchart.nodes.map((item) => item.id === node.id ? { ...item, pageText: event.target.value } : item) })} /><button type="button" onClick={() => setDescriptionId("")}>Done</button></div>}<button type="button" className="project-node-drag" aria-label={`Move ${node.label}`} onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); gesture.current = { id: node.id, mode: "move", element: event.currentTarget.closest("article") as HTMLElement, startX: event.clientX, startY: event.clientY, x: node.x, y: node.y, width: node.width, height: node.height }; }} onPointerMove={(event) => updateGesture(event.clientX, event.clientY)} onPointerUp={(event) => finishGesture(event.clientX, event.clientY)}>⠿</button><button type="button" className="project-node-resize" aria-label={`Resize ${node.label}`} onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); gesture.current = { id: node.id, mode: "resize", element: event.currentTarget.closest("article") as HTMLElement, startX: event.clientX, startY: event.clientY, x: node.x, y: node.y, width: node.width, height: node.height }; }} onPointerMove={(event) => updateGesture(event.clientX, event.clientY)} onPointerUp={(event) => finishGesture(event.clientX, event.clientY)} /></article>)}</div></div>
    {openNodeId && (() => { const node = flowchart.nodes.find((item) => item.id === openNodeId); if (!node) return null; return <div className="project-node-page-overlay" role="dialog" aria-modal="true" aria-label={`${node.label} node page`} onPointerDown={(event) => { if (event.target === event.currentTarget) setOpenNodeId(""); }}><section className="project-node-page"><header><button type="button" onClick={() => setOpenNodeId("")}>Back to flowchart</button><input aria-label="Node page title" value={node.label} onChange={(event) => onChange({ ...flowchart, nodes: flowchart.nodes.map((item) => item.id === node.id ? { ...item, label: event.target.value } : item) })} /></header><textarea aria-label={`${node.label} page content`} value={node.pageText ?? ""} placeholder="Write the details, context, and next steps for this node…" onChange={(event) => onChange({ ...flowchart, nodes: flowchart.nodes.map((item) => item.id === node.id ? { ...item, pageText: event.target.value } : item) })} /></section></div>; })()}
  </section>;
}

export function ProjectMindmapEditor({ mindmap, onChange }: { mindmap: ProjectMindmap; onChange: (mindmap: ProjectMindmap) => void }) {
  const [source, setSource] = useState("");
  const [menuId, setMenuId] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const [openObjectId, setOpenObjectId] = useState("");
  const [descriptionId, setDescriptionId] = useState("");
  const gesture = useRef<{ id: string; mode: "move" | "resize"; element: HTMLElement; startX: number; startY: number; x: number; y: number; width: number; height: number } | null>(null);
  const validIds = new Set(mindmap.objects.map((object) => object.id));
  const objects = mindmap.objects.map((object) => ({ ...object, parentId: object.parentId && validIds.has(object.parentId) && object.parentId !== object.id ? object.parentId : undefined, relationIds: object.relationIds.filter((relationId) => validIds.has(relationId) && relationId !== object.id) }));
  const removeObject = (objectId: string) => onChange({ objects: objects.filter((object) => object.id !== objectId).map((object) => ({ ...object, parentId: object.parentId === objectId ? undefined : object.parentId, relationIds: object.relationIds.filter((id) => id !== objectId) })) });
  const links = objects.flatMap((object) => [
    ...(object.parentId ? [{ id: `parent-${object.id}`, source: object.parentId, target: object.id, kind: "parent" }] : []),
    ...object.relationIds.map((target) => ({ id: `relation-${object.id}-${target}`, source: object.id, target, kind: "relation" })),
  ]).filter((link, index, all) => all.findIndex((candidate) => candidate.source === link.source && candidate.target === link.target && candidate.kind === link.kind) === index);
  const menuObject = objects.find((object) => object.id === menuId);
  const menuObjectName = menuObject?.title.trim() || (menuObject ? `Idea ${objects.indexOf(menuObject) + 1}` : "");
  const updateGesture = (clientX: number, clientY: number) => {
    const active = gesture.current;
    if (!active) return;
    const dx = clientX - active.startX;
    const dy = clientY - active.startY;
    if (active.mode === "move") {
      active.element.style.left = `${Math.max(0, active.x + dx)}px`;
      active.element.style.top = `${Math.max(0, active.y + dy)}px`;
    } else {
      active.element.style.width = `${Math.max(180, Math.min(520, active.width + dx))}px`;
      active.element.style.height = `${Math.max(100, Math.min(320, active.height + dy))}px`;
    }
  };
  const finishGesture = (clientX: number, clientY: number) => {
    const active = gesture.current;
    if (!active) return;
    const dx = clientX - active.startX;
    const dy = clientY - active.startY;
    onChange({ objects: objects.map((object) => object.id !== active.id ? object : active.mode === "move"
      ? { ...object, x: Math.max(0, active.x + dx), y: Math.max(0, active.y + dy) }
      : { ...object, width: Math.max(180, Math.min(520, active.width + dx)), height: Math.max(100, Math.min(320, active.height + dy)) }) });
    gesture.current = null;
  };
  return <section className="project-mode-surface" aria-label="Project mindmap">
    {menuObject && menuAnchor && <FloatingMenu anchor={menuAnchor} label={`${menuObjectName} options`} onClose={() => setMenuId("")}><button type="button" role="menuitem" onClick={() => { setMenuId(""); setOpenObjectId(""); setDescriptionId(menuObject.id); }}>Description</button><button type="button" role="menuitem" onClick={() => { setMenuId(""); setDescriptionId(""); setOpenObjectId(menuObject.id); }}>Open page</button><button type="button" role="menuitem" className="project-node-connect" aria-label={`Connect ${menuObjectName}`} onClick={() => { if (!source) setSource(menuObject.id); else { if (source !== menuObject.id) onChange({ objects: objects.map((item) => item.id === source && !item.relationIds.includes(menuObject.id) ? { ...item, relationIds: [...item.relationIds, menuObject.id] } : item) }); setSource(""); } setMenuId(""); }}>{source === menuObject.id ? "Selected" : "Connect"}</button><label>Color<input type="color" aria-label={`${menuObjectName} color`} value={menuObject.color} onChange={(event) => onChange({ objects: objects.map((item) => item.id === menuObject.id ? { ...item, color: event.target.value } : item) })} /></label><button type="button" role="menuitem" className="project-delete" aria-label={`Delete ${menuObjectName}`} onClick={() => { removeObject(menuObject.id); setMenuId(""); }}>Delete</button></FloatingMenu>}
    <header><h3>Object mindmap</h3><button type="button" onClick={() => onChange({ objects: [...objects, { id: id("object"), title: "", x: 60 + (objects.length % 3) * 250, y: 60 + Math.floor(objects.length / 3) * 180, width: 304, height: 112, color: "#38bdf8", relationIds: [], fields: [] }] })}>+ Idea</button></header>
    <p className="project-map-hint">Type inside a rectangle, then click Connect on two ideas to draw an arrow.</p>
    <div className="project-flow-canvas project-mindmap-canvas" aria-label="Mindmap canvas"><div>
      {links.map((link) => { const from = objects.find((object) => object.id === link.source); const to = objects.find((object) => object.id === link.target); if (!from || !to) return null; const fromName = from.title.trim() || `Idea ${objects.indexOf(from) + 1}`; const toName = to.title.trim() || `Idea ${objects.indexOf(to) + 1}`; const fromX = from.x + from.width / 2, fromY = from.y + from.height / 2, toX = to.x + to.width / 2, toY = to.y + to.height / 2, width = Math.hypot(toX - fromX, toY - fromY), angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI; return <div aria-label={`${link.kind === "parent" ? "Parent" : "Relation"} arrow ${fromName} to ${toName}`} className={`project-flow-edge project-mindmap-edge ${link.kind}`} key={link.id} style={{ left: fromX, top: fromY, width, transform: `rotate(${angle}deg)` }} />; })}
      {objects.map((object, objectIndex) => { const objectName = object.title.trim() || `Idea ${objectIndex + 1}`; return <article key={object.id} className={`project-flow-node project-mindmap-node ${source === object.id ? "connecting" : ""}`} style={{ left: object.x, top: object.y, width: object.width, height: object.height, borderColor: object.color }} onPointerDown={(event) => { if ((event.target as HTMLElement).closest("input, button, label, textarea")) return; event.currentTarget.setPointerCapture(event.pointerId); gesture.current = { id: object.id, mode: "move", element: event.currentTarget, startX: event.clientX, startY: event.clientY, x: object.x, y: object.y, width: object.width, height: object.height }; }} onPointerMove={(event) => updateGesture(event.clientX, event.clientY)} onPointerUp={(event) => finishGesture(event.clientX, event.clientY)}>
        <input className="project-node-text" aria-label={`${objectName} title`} value={object.title} placeholder="Type an idea…" onChange={(event) => onChange({ objects: objects.map((item) => item.id === object.id ? { ...item, title: event.target.value } : item) })} />
        <button type="button" className="project-node-page-trigger" aria-label={`Open ${objectName} page`} onClick={() => { setMenuId(""); setDescriptionId(""); setOpenObjectId(object.id); }}>⚡</button>
        <button type="button" className="project-node-drag" aria-label={`Move ${objectName}`} onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); gesture.current = { id: object.id, mode: "move", element: event.currentTarget.closest("article") as HTMLElement, startX: event.clientX, startY: event.clientY, x: object.x, y: object.y, width: object.width, height: object.height }; }} onPointerMove={(event) => updateGesture(event.clientX, event.clientY)} onPointerUp={(event) => finishGesture(event.clientX, event.clientY)}>⠿</button>
        <div className="project-node-options"><button type="button" className="project-node-options-trigger" aria-label={`Options for ${objectName}`} aria-expanded={menuId === object.id} onClick={(event) => { setDescriptionId(""); setOpenObjectId(""); setMenuAnchor(event.currentTarget); setMenuId((current) => current === object.id ? "" : object.id); }}>•••</button></div>
        {descriptionId === object.id && <div className="project-node-description-popover"><textarea autoFocus aria-label={`${objectName} description`} value={object.pageText ?? ""} placeholder="Add a description…" onChange={(event) => onChange({ objects: objects.map((item) => item.id === object.id ? { ...item, pageText: event.target.value } : item) })} /><button type="button" onClick={() => setDescriptionId("")}>Done</button></div>}
        {object.relationIds.length > 0 && <div className="project-mindmap-links">{object.relationIds.map((relationId) => <button type="button" key={relationId} onClick={() => onChange({ objects: objects.map((item) => item.id === object.id ? { ...item, relationIds: item.relationIds.filter((candidate) => candidate !== relationId) } : item) })}>× {objects.find((item) => item.id === relationId)?.title.trim() || "Untitled idea"}</button>)}</div>}
        <button type="button" className="project-node-resize" aria-label={`Resize ${objectName}`} onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); gesture.current = { id: object.id, mode: "resize", element: event.currentTarget.closest("article") as HTMLElement, startX: event.clientX, startY: event.clientY, x: object.x, y: object.y, width: object.width, height: object.height }; }} onPointerMove={(event) => updateGesture(event.clientX, event.clientY)} onPointerUp={(event) => finishGesture(event.clientX, event.clientY)} />
      </article>; })}
    </div></div>
    {openObjectId && (() => { const pageObject = objects.find((object) => object.id === openObjectId); if (!pageObject) return null; const pageName = pageObject.title.trim() || "Untitled idea"; return <div className="project-node-page-overlay" role="dialog" aria-modal="true" aria-label={`${pageName} node page`}><section className="project-node-page"><header><button type="button" onClick={() => setOpenObjectId("")}>Back to mindmap</button><input aria-label="Node page title" value={pageObject.title} placeholder="Untitled idea" onChange={(event) => onChange({ objects: objects.map((item) => item.id === pageObject.id ? { ...item, title: event.target.value } : item) })} /></header><textarea aria-label={`${pageName} page content`} value={pageObject.pageText ?? ""} placeholder="Write the details, context, and next steps for this idea…" onChange={(event) => onChange({ objects: objects.map((item) => item.id === pageObject.id ? { ...item, pageText: event.target.value } : item) })} /></section></div>; })()}
  </section>;
}
