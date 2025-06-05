// server/controllers/locationController.js
import { addLocation, getLocation } from "../models/locationModel.js";

// 위치 저장 API 로직
async function saveLocation(req, res) {
  const { user_id, lat, lon, address } = req.body;

  try {
    await addLocation(user_id, lat, lon, address);
    res.status(200).json({ success: true, message: "Location saved successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to save location" });
  }
}

// 위치 조회 API 로직
async function fetchLocation(req, res) {
  const { user_id } = req.params;

  try {
    const location = await getLocation(user_id);
    if (location.length > 0) {
      res.status(200).json({ success: true, location: location[0] });
    } else {
      res.status(404).json({ success: false, message: "Location not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch location" });
  }
}

export { saveLocation, fetchLocation };
