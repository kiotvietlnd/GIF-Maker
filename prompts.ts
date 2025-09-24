/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const promptSuggestions = [
  { emoji: '🖱️', prompt: 'Tạo hiệu ứng con trỏ chuột nhấp vào nút chính.' },
  { emoji: '✨', prompt: 'Thêm hiệu ứng tô sáng cho vùng đã chọn.' },
  { emoji: '⌨️', prompt: 'Hiển thị văn bản đang được nhập vào trường đầu vào.' },
  { emoji: '📜', prompt: 'Tạo hiệu ứng nội dung cuộn xuống.' },
  { emoji: '🔄', prompt: 'Hiển thị vòng quay tải xuất hiện.' },
  { emoji: '✅', prompt: 'Tạo hiệu ứng dấu tích xuất hiện để báo hiệu thành công.' },
];

export const buildCreativeInstruction = (
  animationPrompt: string, 
  originalImage: string | null, 
  frameCount: number
): string => {
  const baseInstruction = `Create a short, ${frameCount}-frame animation. The movement should be smooth and believable, and the final frame should loop back smoothly to the first.`;
  const styleConsistencyInstruction = `It is crucial that all ${frameCount} frames are in the same, consistent artistic style, matching the provided image.`;
  const identityLockInstruction = `Maintain the visual elements of the provided image consistently across all frames. Do not add, remove, or significantly distort UI elements unless specifically asked to by the prompt.`;
  
  const frameDurationInstruction = `
Based on the creative direction, determine the optimal frame duration for the animation.
- For slow, deliberate actions (like highlighting), choose a longer duration (e.g., 400-2000ms per frame).
- For fast, quick actions (like clicks), choose a shorter duration (e.g., 80-120ms per frame).
`;

  let creativeDirection = '';
  if (originalImage) {
    creativeDirection = `
CREATIVE DIRECTION (based on user image and prompt):
Animate the provided image based on the following description: "${animationPrompt}".
${baseInstruction}
${styleConsistencyInstruction}
${identityLockInstruction}`;
  } else if (animationPrompt) {
    creativeDirection = `
CREATIVE DIRECTION (based on user prompt):
Create an animation from scratch based on the following description: "${animationPrompt}".
${baseInstruction}`;
  } else {
      return '';
  }

  return `
${creativeDirection}
${frameDurationInstruction}

REQUIRED RESPONSE FORMAT:
Your response MUST contain two parts:
1. A valid JSON object containing a single key: "frameDuration". The value must be a number representing the milliseconds per frame (between 80 and 2000, per instructions above). Do not wrap the JSON in markdown backticks.
2. The ${frameCount}-frame sprite sheet image.

Example of the JSON part:
{"frameDuration": 150}
`;
};