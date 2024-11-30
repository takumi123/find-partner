"use client";

import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-white shadow-sm mt-auto">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-900">
              © 2024 Find Partner. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-gray-900 hover:text-blue-600">
                プライバシーポリシー
              </a>
              <a href="#" className="text-sm text-gray-900 hover:text-blue-600">
                利用規約
              </a>
              <a href="#" className="text-sm text-gray-900 hover:text-blue-600">
                お問い合わせ
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
