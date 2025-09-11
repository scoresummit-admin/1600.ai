import json
import os
from flask import Flask, request, jsonify
import urllib.request
import urllib.parse
import urllib.error

app = Flask(__name__)

@app.post("/")
@app.post("/api/openrouter/route")
def proxy_openrouter():
    """Proxy requests to OpenRouter API to avoid CORS issues"""
    
    # Get API key from environment
    api_key = os.environ.get('VITE_OPENROUTER_API_KEY')
    if not api_key:
        return jsonify({"error": "OpenRouter API key not configured"}), 500
    
    try:
        # Get request data
        request_data = request.get_json()
        if not request_data:
            return jsonify({"error": "No request data provided"}), 400
        
        # Prepare headers
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://1600.ai',
            'X-Title': '1600.ai SAT Solver',
        }
        
        # Add provider preferences for OpenAI models
        model = request_data.get('model', '')
        if model.startswith('openai/'):
            headers['OpenRouter-Prefer-Providers'] = 'azure,openai'
        
        # Prepare request
        data = json.dumps(request_data).encode('utf-8')
        req = urllib.request.Request(
            'https://openrouter.ai/api/v1/chat/completions',
            data=data,
            headers=headers,
            method='POST'
        )
        
        # Make request to OpenRouter
        with urllib.request.urlopen(req, timeout=60) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            
        return jsonify(response_data)
        
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else 'Unknown error'
        return jsonify({
            "error": f"OpenRouter API error: {e.code} {e.reason}",
            "details": error_body
        }), e.code
        
    except urllib.error.URLError as e:
        return jsonify({
            "error": f"Network error: {str(e)}"
        }), 503
        
    except json.JSONDecodeError as e:
        return jsonify({
            "error": f"Invalid JSON in response: {str(e)}"
        }), 500
        
    except Exception as e:
        return jsonify({
            "error": f"Unexpected error: {str(e)}"
        }), 500