import json
import io
import traceback
import signal
import resource
import threading
from contextlib import redirect_stdout, redirect_stderr
import sympy
import numpy as np
from fractions import Fraction
import math
import itertools
import statistics
from flask import Flask, request, jsonify

# -------- limits (unchanged) --------
resource.setrlimit(resource.RLIMIT_CPU, (5, 5))
resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))

def timeout_handler(signum, frame):
    raise TimeoutError("Execution timeout")

def execute_python(code, inputs=None):
    use_alarm = threading.current_thread() is threading.main_thread()
    if use_alarm:
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(5)

    try:
        safe_globals = {
            '__builtins__': {
                'abs': abs, 'all': all, 'any': any, 'bool': bool, 'dict': dict,
                'enumerate': enumerate, 'filter': filter, 'float': float,
                'int': int, 'len': len, 'list': list, 'map': map, 'max': max,
                'min': min, 'pow': pow, 'range': range, 'round': round,
                'set': set, 'sorted': sorted, 'str': str, 'sum': sum,
                'tuple': tuple, 'type': type, 'zip': zip, 'print': print,
            },
            'sympy': sympy,
            'np': np,
            'numpy': np,
            'Fraction': Fraction,
            'math': math,
            'itertools': itertools,
            'statistics': statistics,
        }
        if inputs:
            safe_globals.update(inputs)

        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()

        with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
            exec_globals = safe_globals.copy()
            exec(code, exec_globals)
            result = None
            for name in ['result', 'answer', 'output', 'final']:
                if name in exec_globals:
                    result = exec_globals[name]
                    break
            if result is None:
                lines = code.strip().split('\n')
                if lines:
                    last_line = lines[-1].strip()
                    if last_line and not last_line.startswith(
                        ('print', 'import', 'from', 'def', 'class', 'if', 'for', 'while', 'try', 'with')
                    ):
                        try:
                            result = eval(last_line, exec_globals)
                        except:
                            pass

        stdout_text = stdout_capture.getvalue()
        stderr_text = stderr_capture.getvalue()

        if hasattr(result, 'item'):
            result = result.item()
        elif isinstance(result, np.ndarray):
            result = result.tolist()
        elif hasattr(result, '__float__'):
            try:
                result = float(result)
            except:
                result = str(result)

        return {"ok": True, "result": result, "stdout": stdout_text, "stderr": stderr_text or None}
    except TimeoutError:
        return {"ok": False, "error": "Execution timeout (5 seconds)"}
    except Exception as e:
        return {"ok": False, "error": f"{type(e).__name__}: {str(e)}", "traceback": traceback.format_exc()}
    finally:
        if use_alarm:
            signal.alarm(0)

# -------- Flask app for Vercel --------
app = Flask(__name__)

# Support both root and full path when deployed so that requests to
# `/api/py/exec` on Vercel reach this handler without returning 404.
@app.post("/")
@app.post("/api/py/exec")
def run():
    body = request.get_json(silent=True) or {}
    code = body.get("code", "")
    inputs = body.get("inputs", {})
    if not code:
        return jsonify({"ok": False, "error": "No code provided"}), 400
    result = execute_python(code, inputs)
    return jsonify(result), 200
