export const decodeJWT = (token: string) => {
  // JWT consists of three parts: header, payload, and signature
  const base64Url = token.split('.')[1];  // Get the payload part
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');  // Replace URL-safe base64 characters
  
  // Decode the base64 payload
  const decodedPayload = atob(base64);  // Decode from base64

  // Convert decoded payload (JSON) to an object
  const payload = JSON.parse(decodedPayload);

  return payload;  // Return the decoded payload
};