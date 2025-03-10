'''
This python file will be used to perform all the transformations and calculations for the app.
'''

import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# response = supabase.table("branches").select("*").execute()
# print(response)


# class Node:
#     def __init__(self, id, label):
#         self.id = id
#         self.label = label

# class Edge:
#     def __init__(self, id, label):
#         self.source = id
#         self.target = id
#         self.id = id
#         self.label = label

# const nodes = [
#   { id: '1', label: 'Semiconductor Chips' },
#   { id: '2', label: 'History' },
#   { id: '3', label: 'Future Outlook' },
#   { id: '4', label: 'Applications' }
# ];

# const edges = [
#   { source: '1', target: '2', id: '1-2', label: '1-2' },
#   { source: '1', target: '3', id: '1-3', label: '1-3' },
#   { source: '1', target: '4', id: '1-4', label: '1-4' }
# ];


def add_base_nodes_and_edges(nodes: list[str], root_node: str):

    init_nodes = [{"id": "1", "label": root_node}]
    init_edges = []

    for id, node in enumerate(nodes):
        init_nodes.append({"id": str(id + 2), "label": node})

    for id in range(1, len(init_nodes)):
        init_edges.append({"source": "1", "target": str(id + 1), "id": f"1-{id + 1}", "label": f"1-{id + 1}"})

    response = (
        supabase.table("branches")
            .insert({"root_node": root_node, "nodes": init_nodes, "edges": init_edges, "actions": []})
            .execute()
    )

    return response.data[0]["id"]

def add_nodes_and_edges(branch_id: str, node: str, parent_id: str):
    fetched_branch = (
        supabase.table("branches")
            .select("nodes", "edges", "actions")
            .eq("id", int(branch_id))
            .execute()
    )

    nodes = fetched_branch.data[0]["nodes"]
    edges = fetched_branch.data[0]["edges"]
    
    # Check if node already exists
    existing_node = next((n for n in nodes if n["label"] == node), None)
    
    if existing_node:
        # If node exists, check if edge doesn't exist yet
        if not any(e["source"] == parent_id and e["target"] == existing_node["id"] for e in edges):
            new_edge = {
                "source": parent_id,
                "target": existing_node["id"],
                "id": f"{parent_id}-{existing_node['id']}",
                "label": f"{parent_id}-{existing_node['id']}"
            }
            edges.append(new_edge)
    else:
        # Add new node and edge
        nodes_length = len(nodes)
        new_node = {"id": str(nodes_length + 1), "label": node}
        nodes.append(new_node)
        
        new_edge = {
            "source": parent_id, 
            "target": str(nodes_length + 1), 
            "id": f"{parent_id}-{nodes_length + 1}", 
            "label": f"{parent_id}-{nodes_length + 1}"
        }
        edges.append(new_edge)
    
    actions = fetched_branch.data[0]["actions"]
    actions.append({
        "action": "expand_node", 
        "node": node, 
        "date": datetime.now().isoformat()
    })

    updated_branch = (
        supabase.table("branches")
            .update({"nodes": nodes, "edges": edges, "actions": actions})
            .eq("id", branch_id)
            .execute()
    )

def add_summarise_action(branch_id: str, node: str):
    fetched_branch = (
        supabase.table("branches")
            .select("actions")
            .eq("id", int(branch_id))
            .execute()
    )

    actions = fetched_branch.data[0]["actions"]
    actions.append({"action": "summarise_node", "node": node, "date": datetime.now().isoformat()})

    updated_branch = (
        supabase.table("branches")
            .update({"actions": actions})
            .eq("id", branch_id)
            .execute()
    )

def fetch_nodes_and_edges(branch_id: str):
    fetched_branch = (
        supabase.table("branches")
            .select("nodes", "edges")
            .eq("id", int(branch_id))
            .execute()
    )

    return {"nodes": fetched_branch.data[0]["nodes"], "edges":  fetched_branch.data[0]["edges"]}
    # node_to_add = {"id": str(len(nodes) + 1), "label": node}
    # edge_to_add = {"source": parent_id, "target": str(len(nodes) + 1), "id": f"{parent_id}-{len(nodes) + 1}", "label": f"{parent_id}-{len(nodes) + 1}"}
    
    # response = (
    #     supabase.table("branches")
    #         .update({"nodes": nodes, "edges": edges})
    #         .eq("id", branch_id)
    #         .execute()
    # )

    # return response.id

    # root = Node(root_id, root_label)
    # for new_id, new_label in new_values:
    #     root.children.append(Node(new_id, new_label))
    # return root

# def add_to_leaf_node(root, leaf_id, new_id, new_label):
#     if root.id == leaf_id:
#         root.children.append(Node(new_id, new_label))
#     else:
#         for child in root.children:
#             add_to_leaf_node(child, leaf_id, new_id, new_label)

# def list_tree(node, tree_list=[]):
#     tree_list.append({"id": node.id, "label": node.label})
#     for child in node.children:
#         list_tree(child, tree_list)
#     return tree_list

# def clear_tree(node):
#     node.children = []
#     node.id = None
#     node.label = None


# tree_root = add_to_leaf_node(tree_root, "child1", "grandchild1")