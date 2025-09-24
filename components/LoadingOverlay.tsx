/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import Loader from './Loader';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
      <Loader className="w-24 h-24 text-kv-blue" />
      <p className="mt-4 text-slate-700 text-lg font-medium">Đang tạo GIF của bạn...</p>
    </div>
  );
};

export default LoadingOverlay;