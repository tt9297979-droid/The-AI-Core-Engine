import numpy as np
from flask import Flask, jsonify
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

app = Flask(__name__)

model = Sequential()
model.add(LSTM(64, input_shape=(10,1)))
model.add(Dense(1))
model.compile(optimizer='adam', loss='mse')

@app.route("/predict")
def predict():

# จำลอง (ควรใช้ข้อมูลจริง)
data = np.random.rand(10,1)

pred = model.predict(data.reshape(1,10,1))[0][0]

return jsonify({
"prediction": float(pred),
"confidence": 0.6 + (pred/2)
})

app.run()
