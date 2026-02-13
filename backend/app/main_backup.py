# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import mysql.connector
from mysql.connector import Error
import os

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
 
 #   = = = = = = = = = = = = = = = = = = = =   S T A N D A R D S   M A N A G E M E N T   = = = = = = = = = = = = = = = = = = = = 
 
 @ a p p . p o s t ( " / a p i / s t a n d a r d s " ) 
 
 a s y n c   d e f   c r e a t e _ s t a n d a r d ( s t a n d a r d :   S t a n d a r d ) : 
 
         c o n n   =   g e t _ d b _ c o n n e c t i o n ( ) 
 
         c u r s o r   =   c o n n . c u r s o r ( ) 
 
         t r y : 
 
                 c u r s o r . e x e c u t e ( 
 
                         " I N S E R T   I N T O   s t a n d a r d   ( S t a n d a r d _ L i s t ,   S h o r t _ N a m e )   V A L U E S   ( % s ,   % s ) " , 
 
                         ( s t a n d a r d . S t a n d a r d _ L i s t ,   s t a n d a r d . S h o r t _ N a m e ) 
 
                 ) 
 
                 c o n n . c o m m i t ( ) 
 
                 r e t u r n   { " m e s s a g e " :   " S t a n d a r d   c r e a t e d   s u c c e s s f u l l y " } 
 
         e x c e p t   E r r o r   a s   e : 
 
                 c o n n . r o l l b a c k ( ) 
 
                 r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 5 0 0 ,   d e t a i l = f " D a t a b a s e   e r r o r :   { s t r ( e ) } " ) 
 
         f i n a l l y : 
 
                 c u r s o r . c l o s e ( ) 
 
                 c o n n . c l o s e ( ) 
 
 
 
 @ a p p . p u t ( " / a p i / s t a n d a r d s / { o l d _ n a m e } " ) 
 
 a s y n c   d e f   u p d a t e _ s t a n d a r d ( o l d _ n a m e :   s t r ,   s t a n d a r d :   S t a n d a r d ) : 
 
         c o n n   =   g e t _ d b _ c o n n e c t i o n ( ) 
 
         c u r s o r   =   c o n n . c u r s o r ( ) 
 
         t r y : 
 
                 c u r s o r . e x e c u t e ( 
 
                         " U P D A T E   s t a n d a r d   S E T   S t a n d a r d _ L i s t   =   % s ,   S h o r t _ N a m e   =   % s   W H E R E   S t a n d a r d _ L i s t   =   % s " , 
 
                         ( s t a n d a r d . S t a n d a r d _ L i s t ,   s t a n d a r d . S h o r t _ N a m e ,   o l d _ n a m e ) 
 
                 ) 
 
                 c o n n . c o m m i t ( ) 
 
                 i f   c u r s o r . r o w c o u n t   = =   0 : 
 
                         r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 4 0 4 ,   d e t a i l = " S t a n d a r d   n o t   f o u n d " ) 
 
                 r e t u r n   { " m e s s a g e " :   " S t a n d a r d   u p d a t e d   s u c c e s s f u l l y " } 
 
         e x c e p t   E r r o r   a s   e : 
 
                 c o n n . r o l l b a c k ( ) 
 
                 r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 5 0 0 ,   d e t a i l = f " D a t a b a s e   e r r o r :   { s t r ( e ) } " ) 
 
         f i n a l l y : 
 
                 c u r s o r . c l o s e ( ) 
 
                 c o n n . c l o s e ( ) 
 
 
 
 @ a p p . d e l e t e ( " / a p i / s t a n d a r d s / { s t a n d a r d _ n a m e } " ) 
 
 a s y n c   d e f   d e l e t e _ s t a n d a r d ( s t a n d a r d _ n a m e :   s t r ) : 
 
         c o n n   =   g e t _ d b _ c o n n e c t i o n ( ) 
 
         c u r s o r   =   c o n n . c u r s o r ( ) 
 
         t r y : 
 
                 c u r s o r . e x e c u t e ( " D E L E T E   F R O M   s t a n d a r d   W H E R E   S t a n d a r d _ L i s t   =   % s " ,   ( s t a n d a r d _ n a m e , ) ) 
 
                 c o n n . c o m m i t ( ) 
 
                 r e t u r n   { " m e s s a g e " :   " S t a n d a r d   d e l e t e d   s u c c e s s f u l l y " } 
 
         e x c e p t   E r r o r   a s   e : 
 
                 c o n n . r o l l b a c k ( ) 
 
                 r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 5 0 0 ,   d e t a i l = f " D a t a b a s e   e r r o r :   { s t r ( e ) } " ) 
 
         f i n a l l y : 
 
                 c u r s o r . c l o s e ( ) 
 
                 c o n n . c l o s e ( ) 
 
 
 
 #   = = = = = = = = = = = = = = = = = = = =   I N F O   M A N A G E M E N T   = = = = = = = = = = = = = = = = = = = = 
 
 @ a p p . p o s t ( " / a p i / i n f o " ) 
 
 a s y n c   d e f   c r e a t e _ i n f o ( i n f o :   I n f o ) : 
 
         c o n n   =   g e t _ d b _ c o n n e c t i o n ( ) 
 
         c u r s o r   =   c o n n . c u r s o r ( ) 
 
         t r y : 
 
                 c u r s o r . e x e c u t e ( 
 
                         " " " I N S E R T   I N T O   i n f o   
 
                         ( S t a n d a r d _ L i s t ,   T o t a l _ Q u e s t i o n s ,   P a s s i n g _ C r i t e r i a ,   H o u r s ,   M i n u t e s ,   S e c o n d s )   
 
                         V A L U E S   ( % s ,   % s ,   % s ,   % s ,   % s ,   % s ) " " " , 
 
                         ( i n f o . S t a n d a r d _ L i s t ,   i n f o . T o t a l _ Q u e s t i o n s ,   i n f o . P a s s i n g _ C r i t e r i a ,   
 
                           i n f o . H o u r s ,   i n f o . M i n u t e s ,   i n f o . S e c o n d s ) 
 
                 ) 
 
                 c o n n . c o m m i t ( ) 
 
                 r e t u r n   { " m e s s a g e " :   " I n f o   c r e a t e d   s u c c e s s f u l l y " } 
 
         e x c e p t   E r r o r   a s   e : 
 
                 c o n n . r o l l b a c k ( ) 
 
                 r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 5 0 0 ,   d e t a i l = f " D a t a b a s e   e r r o r :   { s t r ( e ) } " ) 
 
         f i n a l l y : 
 
                 c u r s o r . c l o s e ( ) 
 
                 c o n n . c l o s e ( ) 
 
 
 
 @ a p p . p u t ( " / a p i / i n f o / { s t a n d a r d _ n a m e } " ) 
 
 a s y n c   d e f   u p d a t e _ i n f o ( s t a n d a r d _ n a m e :   s t r ,   i n f o :   I n f o ) : 
 
         c o n n   =   g e t _ d b _ c o n n e c t i o n ( ) 
 
         c u r s o r   =   c o n n . c u r s o r ( ) 
 
         t r y : 
 
                 c u r s o r . e x e c u t e ( 
 
                         " " " U P D A T E   i n f o   
 
                         S E T   S t a n d a r d _ L i s t   =   % s ,   T o t a l _ Q u e s t i o n s   =   % s ,   P a s s i n g _ C r i t e r i a   =   % s ,   
 
                                 H o u r s   =   % s ,   M i n u t e s   =   % s ,   S e c o n d s   =   % s   
 
                         W H E R E   S t a n d a r d _ L i s t   =   % s " " " , 
 
                         ( i n f o . S t a n d a r d _ L i s t ,   i n f o . T o t a l _ Q u e s t i o n s ,   i n f o . P a s s i n g _ C r i t e r i a , 
 
                           i n f o . H o u r s ,   i n f o . M i n u t e s ,   i n f o . S e c o n d s ,   s t a n d a r d _ n a m e ) 
 
                 ) 
 
                 c o n n . c o m m i t ( ) 
 
                 i f   c u r s o r . r o w c o u n t   = =   0 : 
 
                         r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 4 0 4 ,   d e t a i l = " I n f o   n o t   f o u n d " ) 
 
                 r e t u r n   { " m e s s a g e " :   " I n f o   u p d a t e d   s u c c e s s f u l l y " } 
 
         e x c e p t   E r r o r   a s   e : 
 
                 c o n n . r o l l b a c k ( ) 
 
                 r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 5 0 0 ,   d e t a i l = f " D a t a b a s e   e r r o r :   { s t r ( e ) } " ) 
 
         f i n a l l y : 
 
                 c u r s o r . c l o s e ( ) 
 
                 c o n n . c l o s e ( ) 
 
 
 
 @ a p p . d e l e t e ( " / a p i / i n f o / { s t a n d a r d _ n a m e } " ) 
 
 a s y n c   d e f   d e l e t e _ i n f o ( s t a n d a r d _ n a m e :   s t r ) : 
 
         c o n n   =   g e t _ d b _ c o n n e c t i o n ( ) 
 
         c u r s o r   =   c o n n . c u r s o r ( ) 
 
         t r y : 
 
                 c u r s o r . e x e c u t e ( " D E L E T E   F R O M   i n f o   W H E R E   S t a n d a r d _ L i s t   =   % s " ,   ( s t a n d a r d _ n a m e , ) ) 
 
                 c o n n . c o m m i t ( ) 
 
                 r e t u r n   { " m e s s a g e " :   " I n f o   d e l e t e d   s u c c e s s f u l l y " } 
 
         e x c e p t   E r r o r   a s   e : 
 
                 c o n n . r o l l b a c k ( ) 
 
                 r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 5 0 0 ,   d e t a i l = f " D a t a b a s e   e r r o r :   { s t r ( e ) } " ) 
 
         f i n a l l y : 
 
                 c u r s o r . c l o s e ( ) 
 
                 c o n n . c l o s e ( ) 
 
 