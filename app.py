from flask import Flask, render_template, request, jsonify
import os
import json

app = Flask(__name__)

TIMES_FILE = "times.txt"

# Create the file if it doesn't exist
if not os.path.exists(TIMES_FILE):
    with open(TIMES_FILE, "w") as f:
        f.write("")

@app.route('/')
def index():
    # Read saved times
    times = []
    if os.path.exists(TIMES_FILE):
        with open(TIMES_FILE, "r") as f:
            for line in f:
                line = line.strip()
                if line:
                    times.append(line)
    return render_template('index.html', times=times)

@app.route('/save', methods=['POST'])
def save_time():
    data = request.get_json()
    time_str = data.get('time')

    if time_str:
        with open(TIMES_FILE, "a") as f:
            f.write(time_str + "\n")
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "No time provided"})

@app.route('/delete', methods=['POST'])
def delete_time():
    data = request.get_json()
    time_to_delete = data.get('time')

    if time_to_delete:
        # Read all times
        with open(TIMES_FILE, "r") as f:
            times = [line.strip() for line in f if line.strip()]

        # Remove the time to delete
        if time_to_delete in times:
            times.remove(time_to_delete)

            # Write back all remaining times
            with open(TIMES_FILE, "w") as f:
                for time in times:
                    f.write(time + "\n")

            return jsonify({"status": "success"})

    return jsonify({"status": "error", "message": "Time not found"})

if __name__ == '__main__':
    app.run(debug=True)
