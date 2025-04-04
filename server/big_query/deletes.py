from google.cloud import bigquery
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()


PROJECT_ID = os.getenv('PROJECT_ID')
USER_DATASET = os.getenv('USER_DATASET')
CLASSES_DATASET = os.getenv('CLASSES_DATASET')
NEW_STUDENTS_DATASET = os.getenv('NEW_STUDENTS_DATASET')


def hideNewStudent(new_student_id, admin_user_id, client=None):

    if not client:
        client = bigquery.Client.from_service_account_json('google_service_account.json')
    query = f"""
        UPDATE `{NEW_STUDENTS_DATASET}.new_students`
        SET hidden = TRUE
        WHERE
            new_student_id = @new_student_id
            AND EXISTS (
                SELECT 1
                FROM `{PROJECT_ID}.{USER_DATASET}.teachers`
                WHERE user_id = @admin_user_id
                AND admin = TRUE
            )
    """

    query_params = [bigquery.ScalarQueryParameter("admin_user_id", "STRING", admin_user_id),
                    bigquery.ScalarQueryParameter("new_student_id", "STRING", new_student_id)]
    
    job_config = bigquery.QueryJobConfig(query_parameters=query_params)
    return client.query(query, job_config=job_config)



def delete_class(teacher_user_id, class_id, client=None):

    if not client:
        client = bigquery.Client.from_service_account_json('google_service_account.json')

    query = f"""
        DELETE FROM `{CLASSES_DATASET}.classes`
        WHERE class_id=@class_id
        AND teacher_user_id=@teacher_user_id
    """

    query_params = [bigquery.ScalarQueryParameter("teacher_user_id", "STRING", teacher_user_id),
                    bigquery.ScalarQueryParameter("class_id", "STRING", class_id)]
    
    job_config = bigquery.QueryJobConfig(query_parameters=query_params)
    return client.query(query, job_config=job_config)
