# import h5py, json

# path = "X-RAY_FULL_MODEL.keras"

# with h5py.File(path, "r+") as f:
#     raw_config = f.attrs["model_config"]

#     # Handle both bytes and str cases
#     if isinstance(raw_config, bytes):
#         config = raw_config.decode("utf-8")
#     else:
#         config = raw_config

#     model_json = json.loads(config)

#     # Walk through layers and fix InputLayer
#     for layer in model_json["config"]["layers"]:
#         if layer["class_name"] == "InputLayer":
#             if "batch_shape" in layer["config"]:
#                 shape = layer["config"].pop("batch_shape")
#                 # Replace with input_shape (drop batch dim)
#                 layer["config"]["input_shape"] = shape[1:]
#                 print(f"Patched InputLayer: input_shape={layer['config']['input_shape']}")

#     # Save back patched config
#     f.attrs["model_config"] = json.dumps(model_json)
#     print("✅ Model config patched successfully")

from tensorflow.keras.models import load_model
model = load_model("X-RAY_FULL_MODEL.keras", compile=False)
print(model.summary())
