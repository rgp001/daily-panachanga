import type { GeoLocation } from '../lib/astral';

export const PRESET_CITIES: GeoLocation[] = [
  // Default Preset
  { name: 'Bengaluru', region: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' },

  // Major Karnataka & South India
  { name: 'Mysuru', region: 'Karnataka', country: 'India', latitude: 12.2958, longitude: 76.6394, timezone: 'Asia/Kolkata' },
  { name: 'Mangaluru', region: 'Karnataka', country: 'India', latitude: 12.9141, longitude: 74.8560, timezone: 'Asia/Kolkata' },
  { name: 'Hubballi-Dharwad', region: 'Karnataka', country: 'India', latitude: 15.3647, longitude: 75.1240, timezone: 'Asia/Kolkata' },
  { name: 'Udupi', region: 'Karnataka', country: 'India', latitude: 13.3409, longitude: 74.7421, timezone: 'Asia/Kolkata' },
  { name: 'Sringeri', region: 'Karnataka', country: 'India', latitude: 13.4197, longitude: 75.2528, timezone: 'Asia/Kolkata' },
  { name: 'Gokarna', region: 'Karnataka', country: 'India', latitude: 14.5479, longitude: 74.3188, timezone: 'Asia/Kolkata' },
  { name: 'Belagavi', region: 'Karnataka', country: 'India', latitude: 15.8497, longitude: 74.4977, timezone: 'Asia/Kolkata' },
  { name: 'Shivamogga', region: 'Karnataka', country: 'India', latitude: 13.9299, longitude: 75.5681, timezone: 'Asia/Kolkata' },
  { name: 'Tumakuru', region: 'Karnataka', country: 'India', latitude: 13.3379, longitude: 77.1173, timezone: 'Asia/Kolkata' },
  { name: 'Hassan', region: 'Karnataka', country: 'India', latitude: 13.0033, longitude: 76.1004, timezone: 'Asia/Kolkata' },
  { name: 'Kalaburagi', region: 'Karnataka', country: 'India', latitude: 17.3297, longitude: 76.8343, timezone: 'Asia/Kolkata' },
  { name: 'Chennai', region: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata' },
  { name: 'Coimbatore', region: 'Tamil Nadu', country: 'India', latitude: 11.0168, longitude: 76.9558, timezone: 'Asia/Kolkata' },
  { name: 'Madurai', region: 'Tamil Nadu', country: 'India', latitude: 9.9252, longitude: 78.1198, timezone: 'Asia/Kolkata' },
  { name: 'Kanchipuram', region: 'Tamil Nadu', country: 'India', latitude: 12.8342, longitude: 79.7036, timezone: 'Asia/Kolkata' },
  { name: 'Tiruchirappalli', region: 'Tamil Nadu', country: 'India', latitude: 10.7905, longitude: 78.7047, timezone: 'Asia/Kolkata' },
  { name: 'Rameswaram', region: 'Tamil Nadu', country: 'India', latitude: 9.2876, longitude: 79.3129, timezone: 'Asia/Kolkata' },
  { name: 'Kanyakumari', region: 'Tamil Nadu', country: 'India', latitude: 8.0883, longitude: 77.5385, timezone: 'Asia/Kolkata' },
  { name: 'Hyderabad', region: 'Telangana', country: 'India', latitude: 17.3850, longitude: 78.4867, timezone: 'Asia/Kolkata' },
  { name: 'Warangal', region: 'Telangana', country: 'India', latitude: 17.9689, longitude: 79.5941, timezone: 'Asia/Kolkata' },
  { name: 'Tirupati', region: 'Andhra Pradesh', country: 'India', latitude: 13.6288, longitude: 79.4192, timezone: 'Asia/Kolkata' },
  { name: 'Vijayawada', region: 'Andhra Pradesh', country: 'India', latitude: 16.5062, longitude: 80.6480, timezone: 'Asia/Kolkata' },
  { name: 'Visakhapatnam', region: 'Andhra Pradesh', country: 'India', latitude: 17.6868, longitude: 83.2185, timezone: 'Asia/Kolkata' },
  { name: 'Kochi', region: 'Kerala', country: 'India', latitude: 9.9312, longitude: 76.2673, timezone: 'Asia/Kolkata' },
  { name: 'Thiruvananthapuram', region: 'Kerala', country: 'India', latitude: 8.5241, longitude: 76.9366, timezone: 'Asia/Kolkata' },
  { name: 'Kozhikode', region: 'Kerala', country: 'India', latitude: 11.2588, longitude: 75.7804, timezone: 'Asia/Kolkata' },
  { name: 'Guruvayur', region: 'Kerala', country: 'India', latitude: 10.5949, longitude: 76.0398, timezone: 'Asia/Kolkata' },
  { name: 'Puducherry', region: 'Puducherry', country: 'India', latitude: 11.9416, longitude: 79.8083, timezone: 'Asia/Kolkata' },

  // West, Central, North & East India
  { name: 'Mumbai', region: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { name: 'Pune', region: 'Maharashtra', country: 'India', latitude: 18.5204, longitude: 73.8567, timezone: 'Asia/Kolkata' },
  { name: 'Nagpur', region: 'Maharashtra', country: 'India', latitude: 21.1458, longitude: 79.0882, timezone: 'Asia/Kolkata' },
  { name: 'Nashik', region: 'Maharashtra', country: 'India', latitude: 19.9975, longitude: 73.7898, timezone: 'Asia/Kolkata' },
  { name: 'Panaji', region: 'Goa', country: 'India', latitude: 15.4909, longitude: 73.8278, timezone: 'Asia/Kolkata' },
  { name: 'Ahmedabad', region: 'Gujarat', country: 'India', latitude: 23.0225, longitude: 72.5714, timezone: 'Asia/Kolkata' },
  { name: 'Surat', region: 'Gujarat', country: 'India', latitude: 21.1702, longitude: 72.8311, timezone: 'Asia/Kolkata' },
  { name: 'Vadodara', region: 'Gujarat', country: 'India', latitude: 22.3072, longitude: 73.1812, timezone: 'Asia/Kolkata' },
  { name: 'Dwarka', region: 'Gujarat', country: 'India', latitude: 22.2442, longitude: 68.9685, timezone: 'Asia/Kolkata' },
  { name: 'Somnath', region: 'Gujarat', country: 'India', latitude: 20.8880, longitude: 70.4012, timezone: 'Asia/Kolkata' },
  { name: 'New Delhi', region: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090, timezone: 'Asia/Kolkata' },
  { name: 'Gurugram', region: 'Haryana', country: 'India', latitude: 28.4595, longitude: 77.0266, timezone: 'Asia/Kolkata' },
  { name: 'Noida', region: 'Uttar Pradesh', country: 'India', latitude: 28.5355, longitude: 77.3910, timezone: 'Asia/Kolkata' },
  { name: 'Jaipur', region: 'Rajasthan', country: 'India', latitude: 26.9124, longitude: 75.7873, timezone: 'Asia/Kolkata' },
  { name: 'Udaipur', region: 'Rajasthan', country: 'India', latitude: 24.5854, longitude: 73.7125, timezone: 'Asia/Kolkata' },
  { name: 'Jodhpur', region: 'Rajasthan', country: 'India', latitude: 26.2389, longitude: 73.0243, timezone: 'Asia/Kolkata' },
  { name: 'Pushkar', region: 'Rajasthan', country: 'India', latitude: 26.4899, longitude: 74.5511, timezone: 'Asia/Kolkata' },
  { name: 'Varanasi', region: 'Uttar Pradesh', country: 'India', latitude: 25.3176, longitude: 82.9739, timezone: 'Asia/Kolkata' },
  { name: 'Prayagraj', region: 'Uttar Pradesh', country: 'India', latitude: 25.4358, longitude: 81.8463, timezone: 'Asia/Kolkata' },
  { name: 'Ayodhya', region: 'Uttar Pradesh', country: 'India', latitude: 26.7922, longitude: 82.1998, timezone: 'Asia/Kolkata' },
  { name: 'Mathura', region: 'Uttar Pradesh', country: 'India', latitude: 27.4924, longitude: 77.6737, timezone: 'Asia/Kolkata' },
  { name: 'Lucknow', region: 'Uttar Pradesh', country: 'India', latitude: 26.8467, longitude: 80.9462, timezone: 'Asia/Kolkata' },
  { name: 'Kanpur', region: 'Uttar Pradesh', country: 'India', latitude: 26.4499, longitude: 80.3319, timezone: 'Asia/Kolkata' },
  { name: 'Agra', region: 'Uttar Pradesh', country: 'India', latitude: 27.1767, longitude: 78.0081, timezone: 'Asia/Kolkata' },
  { name: 'Haridwar', region: 'Uttarakhand', country: 'India', latitude: 29.9457, longitude: 78.1642, timezone: 'Asia/Kolkata' },
  { name: 'Rishikesh', region: 'Uttarakhand', country: 'India', latitude: 30.0869, longitude: 78.2676, timezone: 'Asia/Kolkata' },
  { name: 'Badrinath', region: 'Uttarakhand', country: 'India', latitude: 30.7433, longitude: 79.4938, timezone: 'Asia/Kolkata' },
  { name: 'Kedarnath', region: 'Uttarakhand', country: 'India', latitude: 30.7346, longitude: 79.0669, timezone: 'Asia/Kolkata' },
  { name: 'Chandigarh', region: 'Chandigarh', country: 'India', latitude: 30.7333, longitude: 76.7794, timezone: 'Asia/Kolkata' },
  { name: 'Amritsar', region: 'Punjab', country: 'India', latitude: 31.6340, longitude: 74.8723, timezone: 'Asia/Kolkata' },
  { name: 'Shimla', region: 'Himachal Pradesh', country: 'India', latitude: 31.1048, longitude: 77.1734, timezone: 'Asia/Kolkata' },
  { name: 'Jammu', region: 'Jammu & Kashmir', country: 'India', latitude: 32.7266, longitude: 74.8570, timezone: 'Asia/Kolkata' },
  { name: 'Srinagar', region: 'Jammu & Kashmir', country: 'India', latitude: 34.0837, longitude: 74.7973, timezone: 'Asia/Kolkata' },
  { name: 'Ujjain', region: 'Madhya Pradesh', country: 'India', latitude: 23.1765, longitude: 75.7885, timezone: 'Asia/Kolkata' },
  { name: 'Bhopal', region: 'Madhya Pradesh', country: 'India', latitude: 23.2599, longitude: 77.4126, timezone: 'Asia/Kolkata' },
  { name: 'Indore', region: 'Madhya Pradesh', country: 'India', latitude: 22.7196, longitude: 75.8577, timezone: 'Asia/Kolkata' },
  { name: 'Raipur', region: 'Chhattisgarh', country: 'India', latitude: 21.2514, longitude: 81.6296, timezone: 'Asia/Kolkata' },
  { name: 'Kolkata', region: 'West Bengal', country: 'India', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata' },
  { name: 'Bhubaneswar', region: 'Odisha', country: 'India', latitude: 20.2961, longitude: 85.8245, timezone: 'Asia/Kolkata' },
  { name: 'Puri', region: 'Odisha', country: 'India', latitude: 19.8135, longitude: 85.8312, timezone: 'Asia/Kolkata' },
  { name: 'Patna', region: 'Bihar', country: 'India', latitude: 25.5941, longitude: 85.1376, timezone: 'Asia/Kolkata' },
  { name: 'Gaya', region: 'Bihar', country: 'India', latitude: 24.7914, longitude: 85.0002, timezone: 'Asia/Kolkata' },
  { name: 'Ranchi', region: 'Jharkhand', country: 'India', latitude: 23.3441, longitude: 85.3096, timezone: 'Asia/Kolkata' },
  { name: 'Guwahati', region: 'Assam', country: 'India', latitude: 26.1445, longitude: 91.7362, timezone: 'Asia/Kolkata' },
  { name: 'Gangtok', region: 'Sikkim', country: 'India', latitude: 27.3314, longitude: 88.6138, timezone: 'Asia/Kolkata' },
  { name: 'Port Blair', region: 'Andaman & Nicobar', country: 'India', latitude: 11.6234, longitude: 92.7265, timezone: 'Asia/Kolkata' },

  // Neighboring & Global Cities
  { name: 'Kathmandu', region: 'Bagmati', country: 'Nepal', latitude: 27.7172, longitude: 85.3240, timezone: 'Asia/Kathmandu' },
  { name: 'Colombo', region: 'Western', country: 'Sri Lanka', latitude: 6.9271, longitude: 79.8612, timezone: 'Asia/Colombo' },
  { name: 'Singapore', region: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore' },
  { name: 'Kuala Lumpur', region: 'Federal Territory', country: 'Malaysia', latitude: 3.1390, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  { name: 'Dubai', region: 'Dubai', country: 'UAE', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { name: 'Abu Dhabi', region: 'Abu Dhabi', country: 'UAE', latitude: 24.4539, longitude: 54.3773, timezone: 'Asia/Dubai' },
  { name: 'Doha', region: 'Doha', country: 'Qatar', latitude: 25.2854, longitude: 51.5310, timezone: 'Asia/Qatar' },
  { name: 'Tokyo', region: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { name: 'Sydney', region: 'NSW', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
  { name: 'Melbourne', region: 'VIC', country: 'Australia', latitude: -37.8136, longitude: 144.9631, timezone: 'Australia/Melbourne' },
  { name: 'Auckland', region: 'Auckland', country: 'New Zealand', latitude: -36.8509, longitude: 174.7645, timezone: 'Pacific/Auckland' },
  { name: 'London', region: 'England', country: 'United Kingdom', latitude: 51.5072, longitude: -0.1276, timezone: 'Europe/London' },
  { name: 'Paris', region: 'Île-de-France', country: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  { name: 'Berlin', region: 'Berlin', country: 'Germany', latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin' },
  { name: 'Zurich', region: 'Zurich', country: 'Switzerland', latitude: 47.3769, longitude: 8.5417, timezone: 'Europe/Zurich' },
  { name: 'New York', region: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
  { name: 'Chicago', region: 'Illinois', country: 'United States', latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago' },
  { name: 'Austin', region: 'Texas', country: 'United States', latitude: 30.2672, longitude: -97.7431, timezone: 'America/Chicago' },
  { name: 'San Francisco', region: 'California', country: 'United States', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles' },
  { name: 'Seattle', region: 'Washington', country: 'United States', latitude: 47.6062, longitude: -122.3321, timezone: 'America/Los_Angeles' },
  { name: 'Toronto', region: 'Ontario', country: 'Canada', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto' },
  { name: 'Vancouver', region: 'British Columbia', country: 'Canada', latitude: 49.2827, longitude: -123.1207, timezone: 'America/Vancouver' },
  { name: 'Port Louis', region: 'Port Louis', country: 'Mauritius', latitude: -20.1609, longitude: 57.5012, timezone: 'Indian/Mauritius' },
  { name: 'Suva', region: 'Central', country: 'Fiji', latitude: -18.1416, longitude: 178.4419, timezone: 'Pacific/Fiji' },
];

export const QUICK_PRESET_NAMES = [
  'Bengaluru',
  'Mysuru',
  'Chennai',
  'Hyderabad',
  'Mumbai',
  'New Delhi',
  'Varanasi',
];

export const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Kathmandu',
  'Asia/Colombo',
  'Asia/Singapore',
  'Asia/Dubai',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
  'UTC',
];

export interface GeocodingResult extends GeoLocation {
  source: 'local' | 'remote';
}

export async function searchRemoteCities(
  query: string,
  signal?: AbortSignal
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    trimmed
  )}&count=8&language=en&format=json`;

  const response = await fetch(url, { signal });
  if (!response.ok) return [];
  const data = await response.json();
  if (!Array.isArray(data?.results)) return [];

  return data.results
    .filter(
      (item: Record<string, unknown>) =>
        typeof item.latitude === 'number' &&
        typeof item.longitude === 'number' &&
        typeof item.name === 'string'
    )
    .map((item: Record<string, unknown>) => ({
      name: String(item.name),
      region: typeof item.admin1 === 'string' ? item.admin1 : undefined,
      country: typeof item.country === 'string' ? item.country : undefined,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      timezone:
        typeof item.timezone === 'string' && item.timezone
          ? item.timezone
          : 'Asia/Kolkata',
      source: 'remote' as const,
    }));
}
