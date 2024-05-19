import subprocess
import threading


def start_django_server():
    subprocess.run(["python", "manage.py", "runserver", "--noreload", "--nothreading", "0.0.0.0:8005"])


def start_django_worker():
    subprocess.run(['python', 'manage.py', 'worker'])


if __name__ == '__main__':
    server_thread = threading.Thread(target=start_django_server)
    worker_thread = threading.Thread(target=start_django_worker)

    server_thread.start()
    worker_thread.start()

    server_thread.join()
    worker_thread.join()
