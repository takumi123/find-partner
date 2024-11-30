"use client";

import React, { useState } from 'react';

interface EvaluationItem {
  id: string;
  name: string;
  weight: number;
  description: string;
}

export const EvaluationManager = () => {
  const [items, setItems] = useState<EvaluationItem[]>([
    {
      id: '1',
      name: 'コミュニケーション能力',
      weight: 30,
      description: '会話の質、頻度、適切な応答など',
    },
    {
      id: '2',
      name: '積極性',
      weight: 25,
      description: '行動の主体性、提案力など',
    },
  ]);

  const [newItem, setNewItem] = useState<Omit<EvaluationItem, 'id'>>({
    name: '',
    weight: 0,
    description: '',
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleAddItem = () => {
    if (newItem.name && newItem.weight > 0) {
      setItems([
        ...items,
        {
          id: Date.now().toString(),
          ...newItem,
        },
      ]);
      setNewItem({ name: '', weight: 0, description: '' });
      setIsEditing(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">評価項目管理</h2>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
          onClick={() => setIsEditing(true)}
        >
          新規項目追加
        </button>
      </div>

      {isEditing && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-md font-medium text-gray-900 mb-3">新規評価項目</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                項目名
              </label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-gray-900"
                placeholder="例：コミュニケーション能力"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                重み（%）
              </label>
              <input
                type="number"
                value={newItem.weight}
                onChange={(e) => setNewItem({ ...newItem, weight: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md text-gray-900"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                説明
              </label>
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-gray-900"
                rows={3}
                placeholder="評価項目の詳細な説明"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                onClick={() => setIsEditing(false)}
              >
                キャンセル
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                onClick={handleAddItem}
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-md font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-900 mt-1">{item.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-600">
                  重み: {item.weight}%
                </span>
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">合計重み</span>
            <span className={`font-medium ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
              {totalWeight}%
            </span>
          </div>
          {totalWeight !== 100 && (
            <p className="text-sm text-red-600 mt-2">
              ※ 重みの合計は100%になるように調整してください
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
