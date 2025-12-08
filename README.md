python -m venv venv
# En Windows:
.\venv\Scripts\activate
# Instala FastAPI y Uvicorn (el servidor)
pip install fastapi uvicorn websockets

uvicorn main:app --reload

ejecutar en la raiz 
npx create-next-app@latest frontend
cd frontend
# Instalar una librería de iconos para que se vea pro
npm install lucide-react