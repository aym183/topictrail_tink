from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from utils import add_base_nodes_and_edges, add_nodes_and_edges, fetch_nodes_and_edges, add_summarise_action
import os
from dotenv import load_dotenv
from openai import OpenAI
# from mem0 import MemoryClient

'''This file is used to interact with the APIs and create the tree structure for the app.'''


'''Instantiations'''
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

load_dotenv()
# memo_client = MemoryClient(api_key=os.getenv('MEM0AI_API_KEY'))
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

@app.get("/generate-base-tree")
async def root(prompt: str):
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "I want you to be a knowledge expert where when I ask you about something I want to learn about, you should give me an answer of the most important topics around that topic. Please make sure you list a max of 5 and focus of quality. I want to gain a foundational understanding of each topic so please have a broad sense before responding, thinking about factors such as the history, origins, whilst also considering the present and future state. Please strictly restrict your answers to 4 bullet points and please try to keep each point to one word each with the header, no more details are necessary. Here is an example of how it should work.\nQuestion - I want to learn about Semiconductor Chips\nAnswer\nTopic - Semiconductor Chips\n1. History\n2. Key Components\n3. Future Outlook\n4. Production."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2
    )
        
    response = completion.choices[0].message.content
    response_lines = response.split('\n')
    tree_root_value = response_lines[0].split('-')[1].strip()
    child_nodes = [line.split('.')[1].strip() for line in response_lines[1:] if line]

    branch_id = add_base_nodes_and_edges(child_nodes, tree_root_value)

    return {"branch_id": branch_id, "tree_root": tree_root_value}

@app.get("/fetch-nodes-and-edges")
async def get_nodes_and_edges(branch_id: str):

    result = fetch_nodes_and_edges(branch_id)
    return result

# Needs to be in realtime
# Needs to have the context of the root and the parent of which the element is used
@app.get("/summarise-element")
async def summarise_element(topic: str, root: str, branch_id: str, parent_value: str):
    async def generate_summary():
        try:
            summary = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "I want you to be a subject matter expert on topics that a user asks you about. A user will ask you about any topic or sub-topic with the context of the topic in mind which it relates to. You need to give a response strictly within 2500 characters with an informative summary about the topic mentioned. Structure it as a paragraph to give an overview and then headings for each relevant topic. Quality is more important here so try to have a max of 3 headers you can go deeper into."},
                    {"role": "user", "content": f"Can you give me a summary about {topic} in the context of {root} within 2500 characters?"}
                ],
                temperature=0.2,
                stream=True,
                max_completion_tokens=2500
            )

            for chunk in summary:
                content = chunk.choices[0].delta.content
                if content is not None:
                    for char in content:
                        yield char
                else:
                    print("Received None content from OpenAI API")

        except Exception as e:
            print(f"Error during streaming: {e}")
    add_summarise_action(branch_id, parent_value)
    return StreamingResponse(generate_summary(), media_type="text/plain")

    # for chunk in summary:
    #     print(chunk.choices[0].delta.content)
    # return {"message": "Summarising element"}

@app.post("/expand-element")
async def expand_element(branch_id: str, parent_id: str, parent_value: str, root: str):
    expand_output = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "I want you to be a knowledge expert where when I ask you about something I want to learn about, you should give me an answer of the most important topics around that topic. Please make sure you list a max of 3 and focus of quality, this could be components of the system or stages of its history - this is upto you. Please strictly restrict your answers to 3 bullet points and please try to keep each point to one word each with the header, no more details are necessary. The context here is that the user will already be learning about some topic and this will be used to give them topics to go deeper into as part of their learning of a specific aspect. Here is an example of how it should work.\nQuestion - I want to go deeper into the topic of brain anatomy related to neuroscience\nAnswer\n1. Cortex\n2. Lobes\n2. Neurons"},
            {"role": "user", "content": f"I want to go deeper into the topic of {parent_value} related to {root}"}
        ],
        temperature=0.2
    )

    response = expand_output.choices[0].message.content
    response_lines = response.split('\n')
    child_nodes = [line.split('.')[1].strip() for line in response_lines[1:] if line]

    for child in child_nodes:
        add_nodes_and_edges(branch_id, child, parent_id)

    return {"child_nodes": child_nodes}

@app.get("/generate-knowledge-sources")
async def generate_knowledge_sources():
    return {"message": "Generating knowledge sources"}


