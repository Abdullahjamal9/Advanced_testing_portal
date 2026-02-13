# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import mysql.connector
from mysql.connector import Error
import os
from pathlib import Path

# Import certificate generator
from .certificate_generator import generate_certificate, GENERATED_DIR

app = FastAPI(title="PTIS API")

# Enable CORS so frontend can call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MySQL connection configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'AJptis-3692'),
    'database': os.getenv('DB_NAME', 'ptis_testing')
}

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

# Models
class Employee(BaseModel):
    ID: str
    Name: str

class Standard(BaseModel):
    Standard_List: str
    Short_Name: str

class Info(BaseModel):
    Standard_List: str
    Total_Questions: int
    Passing_Criteria: str
    Hours: int = 0
    Minutes: int = 0
    Seconds: int = 0

class Question(BaseModel):
    NO: Optional[int] = None
    Question: str
    Opt_A: str
    Opt_B: str
    Opt_C: str
    Opt_D: str
    Answer: str
    Standard_List: str

class Result(BaseModel):
    ID: str
    NAME: str
    TOTAL_QUESTION: int
    CORRECT_ANSWER: int
    WRONG_ANSWER: int
    PERCENTAGE: str
    PASSING_CRITERIA: str = "70%"
    STATUS: str
    STANDARD: str
    DATE: str
    FINAL_SCORE: Optional[str] = None  # Optional field from frontend

# Endpoints
@app.get("/")
async def root():
    return {
        "message": "PTIS API Server",
        "version": "1.0",
        "database": "MySQL",
        "endpoints": {
            "employees": "/api/employees",
            "standards": "/api/standards",
            "info": "/api/info?standard={standard}",
            "questions": "/api/questions?standard={standard}",
            "results": "/api/results"
        },
        "docs": "/docs"
    }

@app.get("/api/employees")
async def get_employees():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT ID, NAME as Name FROM employees")
        employees = cursor.fetchall()
        return employees
    except Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.post("/api/employees")
async def create_employee(employee: Employee):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO employees (ID, NAME) VALUES (%s, %s)",
            (employee.ID, employee.Name)
        )
        conn.commit()
        return {"message": "Employee created"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.put("/api/employees/{employee_id}")
async def update_employee(employee_id: str, employee: Employee):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE employees SET NAME = %s WHERE ID = %s",
            (employee.Name, employee_id)
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Employee not found")
        return {"message": "Employee updated"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/employees/{employee_id}")
async def delete_employee(employee_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM employees WHERE ID = %s", (employee_id,))
        conn.commit()
        return {"message": "Employee deleted"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/standards")
async def get_standards():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM standard")
        standards = cursor.fetchall()
        return standards
    except Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/info")
async def get_info(standard: str = None):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if standard:
            # Get specific standard's info
            cursor.execute(
                "SELECT ID, Standard_List, Total_Questions, Passing_Criteria, Hours as hours, Minutes as minutes, Seconds as seconds FROM info WHERE Standard_List = %s",
                (standard,)
            )
            std = cursor.fetchone()
            if not std:
                raise HTTPException(status_code=404, detail="Standard not found")
            return std
        else:
            # Get all info records
            cursor.execute("SELECT ID, Standard_List, Total_Questions, Passing_Criteria, Hours, Minutes, Seconds FROM info")
            return cursor.fetchall()
    except Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/questions")
async def get_questions(standard: str):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT NO, Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, Standard_List as Standard FROM questions WHERE Standard_List = %s",
            (standard,)
        )
        questions = cursor.fetchall()
        return questions
    except Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/results")
async def get_results():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM result ORDER BY DATE DESC")
        results = cursor.fetchall()
        # Transform for frontend compatibility
        transformed = []
        for r in results:
            transformed.append({
                "ID": r.get("ID"),
                "NAME": r.get("NAME"),
                "TOTAL_QUESTION": r.get("TOTAL_QUESTION"),
                "CORRECT_ANSWER": r.get("CORRECT_ANSWER"),
                "WRONG_ANSWER": r.get("WRONG_ANSWER"),
                "PERCENTAGE": r.get("PERCENTAGE"),
                "PASSING_CRITERIA": r.get("PASSING_CRITERIA"),
                "STATUS": r.get("STATUS"),
                "STANDARD": r.get("STANDARD"),
                "DATE": r.get("DATE")
            })
        return transformed
    except Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.post("/api/results")
async def save_result(result: Result):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO result 
            (ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, 
             PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (result.ID, result.NAME, result.TOTAL_QUESTION, result.CORRECT_ANSWER,
             result.WRONG_ANSWER, result.PERCENTAGE, result.PASSING_CRITERIA,
             result.STATUS, result.STANDARD, result.DATE)
        )
        conn.commit()
        return {"message": "Result saved successfully", "id": cursor.lastrowid}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/results/{employee_id}/{standard}/{date}")
async def delete_result(employee_id: str, standard: str, date: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "DELETE FROM result WHERE ID = %s AND STANDARD = %s AND DATE = %s",
            (employee_id, standard, date)
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Result not found")
        return {"message": "Result deleted successfully"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# ==================== STANDARDS MANAGEMENT ====================
@app.post("/api/standards")
async def create_standard(standard: Standard):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO standard (Standard_List, Short_Name) VALUES (%s, %s)",
            (standard.Standard_List, standard.Short_Name)
        )
        conn.commit()
        return {"message": "Standard created successfully"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.put("/api/standards/{old_name}")
async def update_standard(old_name: str, standard: Standard):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE standard SET Standard_List = %s, Short_Name = %s WHERE Standard_List = %s",
            (standard.Standard_List, standard.Short_Name, old_name)
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Standard not found")
        return {"message": "Standard updated successfully"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/standards/{standard_name}")
async def delete_standard(standard_name: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM standard WHERE Standard_List = %s", (standard_name,))
        conn.commit()
        return {"message": "Standard deleted successfully"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# ==================== INFO MANAGEMENT ====================
@app.post("/api/info")
async def create_info(info: Info):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO info 
            (Standard_List, Total_Questions, Passing_Criteria, Hours, Minutes, Seconds) 
            VALUES (%s, %s, %s, %s, %s, %s)""",
            (info.Standard_List, info.Total_Questions, info.Passing_Criteria, 
             info.Hours, info.Minutes, info.Seconds)
        )
        conn.commit()
        return {"message": "Info created successfully"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.put("/api/info/{standard_name}")
async def update_info(standard_name: str, info: Info):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """UPDATE info 
            SET Standard_List = %s, Total_Questions = %s, Passing_Criteria = %s, 
                Hours = %s, Minutes = %s, Seconds = %s 
            WHERE Standard_List = %s""",
            (info.Standard_List, info.Total_Questions, info.Passing_Criteria,
             info.Hours, info.Minutes, info.Seconds, standard_name)
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Info not found")
        return {"message": "Info updated successfully"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/info/{standard_name}")
async def delete_info(standard_name: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM info WHERE Standard_List = %s", (standard_name,))
        conn.commit()
        return {"message": "Info deleted successfully"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# ==================== QUESTIONS MANAGEMENT ====================
@app.post("/api/questions")
async def create_question(question: Question):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO questions 
            (Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, Standard_List) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (question.Question, question.Opt_A, question.Opt_B, question.Opt_C,
             question.Opt_D, question.Answer, question.Standard_List)
        )
        conn.commit()
        return {"message": "Question created successfully", "id": cursor.lastrowid}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.put("/api/questions/{question_no}")
async def update_question(question_no: int, question: Question):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """UPDATE questions 
            SET Question = %s, Opt_A = %s, Opt_B = %s, Opt_C = %s, Opt_D = %s, 
                Answer = %s, Standard_List = %s 
            WHERE NO = %s""",
            (question.Question, question.Opt_A, question.Opt_B, question.Opt_C,
             question.Opt_D, question.Answer, question.Standard_List, question_no)
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Question not found")
        return {"message": "Question updated successfully"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/questions/{question_no}")
async def delete_question(question_no: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM questions WHERE NO = %s", (question_no,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Question not found")
        return {"message": "Question deleted successfully"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()


# ============= CERTIFICATE GENERATION ENDPOINTS =============

class CertificateRequest(BaseModel):
    emp_id: str
    emp_name: str
    test_date: str
    status: str
    standard: str
    percentage: str
    passing_criteria: str = "70%"

@app.post("/api/certificates/generate")
async def generate_certificate_endpoint(request: CertificateRequest):
    """
    Generate a certificate for a passed candidate
    
    Request body:
    {
        "emp_id": "123",
        "emp_name": "John Doe",
        "test_date": "2025-01-27",
        "status": "Pass",
        "standard": "DS-1 3rd Volume 5th Edition",
        "percentage": "85.5",
        "passing_criteria": "70%"
    }
    """
    try:
        # Validate status is Pass
        if request.status.lower() != "pass":
            raise HTTPException(status_code=400, detail="Certificate can only be generated for passed candidates")
        
        # Map standard name to template type
        # Extract template type from standard name
        standard_lower = request.standard.lower()
        
        if "ds-1" in standard_lower or "ds1" in standard_lower:
            template_type = "Ds-1"
        elif "cumulative" in standard_lower:
            template_type = "Cumulative"
        elif "api rp 7g-2" in standard_lower or "api rp 7g2" in standard_lower:
            template_type = "API RP 7G-2"
        elif "api spec 5ct" in standard_lower or "5a5" in standard_lower:
            template_type = "API SPEC 5CT & 5A5"
        elif "mt" in standard_lower and "magnetic" in standard_lower:
            template_type = "MT"
        elif "pt" in standard_lower and ("penetrant" in standard_lower or "liquid" in standard_lower):
            template_type = "PT"
        elif "ut" in standard_lower and "ultrasonic" in standard_lower:
            template_type = "UT"
        elif "vt" in standard_lower and "visual" in standard_lower:
            template_type = "VT"
        else:
            # Default to Ds-1 as fallback
            template_type = "Ds-1"
        
        # Generate certificate
        output_path, certificate_filename = generate_certificate(
            emp_id=request.emp_id,
            emp_name=request.emp_name,
            test_date=request.test_date,
            status=request.status,
            template_type=template_type,
            standard_text=request.standard,
            percentage_text=request.percentage,
            criteria_text=request.passing_criteria,
            skip_dates=True
        )
        
        if not output_path or not certificate_filename:
            raise HTTPException(status_code=500, detail="Failed to generate certificate")
        
        # Return file response to download
        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=certificate_filename,
            headers={
                "Content-Disposition": f"attachment; filename={certificate_filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating certificate: {str(e)}")


@app.get("/api/certificates/list")
async def list_generated_certificates():
    """
    List all generated certificates
    """
    try:
        certificates = []
        if GENERATED_DIR.exists():
            for cert_file in GENERATED_DIR.glob("*.pdf"):
                certificates.append({
                    "filename": cert_file.name,
                    "size": cert_file.stat().st_size,
                    "created": cert_file.stat().st_ctime
                })
        return {"certificates": certificates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing certificates: {str(e)}")


@app.get("/api/certificates/download/{filename}")
async def download_certificate(filename: str):
    """
    Download a previously generated certificate
    """
    try:
        file_path = GENERATED_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        return FileResponse(
            path=str(file_path),
            media_type="application/pdf",
            filename=filename,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading certificate: {str(e)}")
