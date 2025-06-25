export const decodeJWT = (token: string) => {
  // JWT consists of three parts: header, payload, and signature
  const base64Url = token.split(".")[1]; // Get the payload part
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/"); // Replace URL-safe base64 characters

  // Decode the base64 payload
  const decodedPayload = atob(base64); // Decode from base64

  // Convert decoded payload (JSON) to an object
  const payload = JSON.parse(decodedPayload);

  return payload; // Return the decoded payload
};

export function limitMaxWords(text: string, maxWords: number): string {
  // Tách chuỗi thành mảng các từ, loại bỏ khoảng trắng thừa
  const words = text.trim().split(/\s+/);

  // Nếu số từ nhỏ hơn hoặc bằng maxWords, trả về nguyên chuỗi
  if (words.length <= maxWords) {
    return text;
  }

  // Lấy maxWords từ đầu tiên và nối lại, thêm dấu ...
  return words.slice(0, maxWords).join(" ") + "...";
}

export function limitMaxCharacters(text: string, maxChars: number): string {
  // Nếu chuỗi rỗng hoặc ngắn hơn maxChars, trả về nguyên chuỗi
  if (!text || text.length <= maxChars) {
    return text;
  }

  // Cắt chuỗi đến maxChars và thêm dấu ...
  return text.slice(0, maxChars) + "...";
}

export function formatEpochToDate(epochTimestamp: number): string {
  // Kiểm tra xem timestamp là giây (10 chữ số) hay mili giây (13 chữ số)
  const timestampInMs =
    epochTimestamp.toString().length > 10
      ? epochTimestamp
      : epochTimestamp * 1000;

  const date = new Date(timestampInMs);

  // Lấy ngày, tháng, năm
  const day = String(date.getDate()).padStart(2, "0"); // Đảm bảo 2 chữ số
  const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() trả về 0-11, nên +1
  const year = date.getFullYear();

  // Trả về định dạng dd/mm/yyyy
  return `${day}/${month}/${year}`;
}

export function formatEpochToDateTime(epochTimestamp: number): string {
  // Kiểm tra xem timestamp là giây (10 chữ số) hay mili giây (13 chữ số)
  const timestampInMs =
    epochTimestamp.toString().length > 10
      ? epochTimestamp
      : epochTimestamp * 1000;

  const date = new Date(timestampInMs);

  // Lấy giờ và phút
  const hours = String(date.getHours()).padStart(2, "0"); // Đảm bảo 2 chữ số
  const minutes = String(date.getMinutes()).padStart(2, "0"); // Đảm bảo 2 chữ số

  // Lấy ngày, tháng, năm
  const day = String(date.getDate()).padStart(2, "0"); // Đảm bảo 2 chữ số
  const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() trả về 0-11, nên +1
  const year = date.getFullYear();

  // Trả về định dạng hh:mm dd/mm/yyyy
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

export function formatMinutesToHoursAndMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength) + "...";
}
