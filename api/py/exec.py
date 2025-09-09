import json
import sys
import io
import traceback
import signal
import resource
from contextlib import redirect_stdout, redirect_stderr
import sympy
import numpy as np
from fractions import Fraction
import math
import itertools
import statistics

# Set resource limits
resource.setrlimit(resource.RLIMIT_CPU, (5, 5))  # 5 second CPU limit
resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))  # 256MB memory limit

def timeout_handler(signum, frame):
    raise TimeoutError("Execution timeout")

def execute_python(code, inputs=None):
    """Execute Python code in a restricted environment"""
    
    # Set up timeout
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(5)  # 5 second timeout
    
    try:
        # Create restricted namespace
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
        
        # Add inputs if provided
        if inputs:
            safe_globals.update(inputs)
        
        # Capture stdout
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()
        
        with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
            # Execute the code
            exec_globals = safe_globals.copy()
            exec(code, exec_globals)
            
            # Try to get result from common variable names
            result = None
            for var_name in ['result', 'answer', 'output', 'final']:
                if var_name in exec_globals:
                    result = exec_globals[var_name]
                    break
            
            # If no result variable found, try to evaluate the last expression
            if result is None:
                lines = code.strip().split('\n')
                if lines:
                    last_line = lines[-1].strip()
                    if last_line and not last_line.startswith(('print', 'import', 'from', 'def', 'class', 'if', 'for', 'while', 'try', 'with')):
                        try:
                            result = eval(last_line, exec_globals)
                        except:
                            pass
        
        stdout_text = stdout_capture.getvalue()
        stderr_text = stderr_capture.getvalue()
        
        # Convert numpy types to Python types for JSON serialization
        if hasattr(result, 'item'):
            result = result.item()
        elif isinstance(result, np.ndarray):
            result = result.tolist()
        elif hasattr(result, '__float__'):
            try:
                result = float(result)
            except:
                result = str(result)
        
        return {
            'ok': True,
            'result': result,
            'stdout': stdout_text,
            'stderr': stderr_text if stderr_text else None
        }
        
    except TimeoutError:
        return {
            'ok': False,
            'error': 'Execution timeout (5 seconds)'
        }
    except Exception as e:
        return {
            'ok': False,
            'error': f"{type(e).__name__}: {str(e)}",
            'traceback': traceback.format_exc()
        }
    finally:
        signal.alarm(0)  # Cancel timeout

def handler(event, context):
    """Vercel serverless function handler"""
    try:
        # Parse request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        code = body.get('code', '')
        inputs = body.get('inputs', {})
        
        if not code:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': False, 'error': 'No code provided'})
            }
        
        result = execute_python(code, inputs)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(result)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'ok': False,
                'error': f"Handler error: {str(e)}"
            })
        }

# For local testing
if __name__ == '__main__':
    test_code = """
import sympy as sp
x = sp.Symbol('x')
equation = sp.Eq(2*x + 3, 7)
solution = sp.solve(equation, x)[0]
result = solution
print(f"Solution: x = {solution}")
"""
    
    result = execute_python(test_code)
    print(json.dumps(result, indent=2))