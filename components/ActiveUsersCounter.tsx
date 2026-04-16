"use client";

import { useState } from 'react';
import { usePresence } from '@/hooks/usePresence';
import { FaCircle, FaTimes } from 'react-icons/fa';
import { Link } from '@/navigation';

export default function ActiveUsersCounter() {
  const { activeUsers, onlineUsers } = usePresence();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Clickable Counter */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-success/20 text-success rounded-lg border border-success/30 hover:bg-success/30 transition-colors cursor-pointer"
      >
        <FaCircle className="text-xs animate-pulse" />
        <span className="font-semibold text-sm">
          {activeUsers} {activeUsers === 1 ? 'user' : 'users'} online
        </span>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-base-100 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-base-300">
              <div className="flex items-center gap-2">
                <FaCircle className="text-success text-xs animate-pulse" />
                <h3 className="font-bold text-lg">
                  {activeUsers} {activeUsers === 1 ? 'User' : 'Users'} Online
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <FaTimes />
              </button>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto p-4">
              {onlineUsers.length === 0 ? (
                <p className="text-center text-base-content/60 py-8">No users online</p>
              ) : (
                <div className="space-y-2">
                  {onlineUsers.map((user) => (
                    <Link
                      key={user.userId}
                      href={`/${user.username || `dancer/${user.userId}`}`}
                      onClick={() => setIsModalOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors"
                    >
                      <FaCircle className="text-success text-xs" />
                      <span className="font-medium">{user.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-base-300 text-center text-xs text-base-content/60">
              Click on a user to view their profile
            </div>
          </div>
        </div>
      )}
    </>
  );
}

