# TopicTrail Tink 🌟

An interactive knowledge exploration tool built during the 2-hour AI Tinkerers Hackathon. TopicTrail helps users visualize and explore complex topics through an interactive graph interface, providing summaries and academic sources for deeper understanding.

## Features 🚀

- **Interactive Knowledge Graph**: Start with any topic and see it branch into key concepts
- **Dynamic Exploration**: Three main actions for any selected node:
  - 📝 **Summarize**: Get a detailed overview of the concept
  - 🔍 **Deep Dive**: Access a concise 50-word summary and relevant academic papers
  - 🌳 **Expand**: Discover related subtopics and continue exploring

- **Academic Integration**: Automatically fetches relevant papers from Semantic Scholar API
- **Context-Aware**: Maintains topic context throughout the exploration chain
- **Beautiful UI**: Clean, modern interface with a star-field animation background

## Tech Stack 💻

- Frontend: Next.js, React, TypeScript
- Backend: FastAPI, Python
- APIs: OpenAI GPT-4, Semantic Scholar
- Database: Supabase
- Styling: Tailwind CSS

## Getting Started 🏁

1. Clone the repository
```bash
git clone https://github.com/aym183/topictrail_tink.git
cd topictrail_tink
```

2. Set up environment variables
```bash
# Create .env file and add your API keys
OPENAI_API_KEY=your_key_here
SUPABASE_URL=your_url_here
SUPABASE_ANON_KEY=your_key_here
```

3. Run the backend
```bash
make install
make run
```

3. Run the frontend
```bash
npm install
npm run dev
```

## How It Works 🔄

1. Enter any topic you want to learn about
2. The app generates a knowledge graph with key aspects of the topic
3. Click on any node to:
   - Get a comprehensive summary
   - Access academic sources and a quick overview
   - Expand into subtopics for deeper exploration
4. Continue exploring through the knowledge tree!

## Contributing 🤝

This project was created during a 2-hour hackathon by AI Tinkerers, but we welcome contributions! Feel free to:
- Open issues
- Submit pull requests
- Suggest improvements
- Share your ideas

## License 📄

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Acknowledgments 🙏

- Built during the AI Tinkerers 2-hour Hackathon by [Ayman Ali](https://www.linkedin.com/in/ayman-ali1302/) and [Maria Luque](https://www.linkedin.com/in/marialuqueanguita/) 
- Uses OpenAI's GPT-4 for intelligent topic exploration
- Semantic Scholar API for academic paper integration
