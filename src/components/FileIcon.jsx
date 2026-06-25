import React from 'react';
import { FileCode2, FileJson, FileText, FileImage, Folder, Settings, Database, Terminal } from 'lucide-react';

export const FileIcon = ({ filename, size = 16, expanded = false }) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  
  // Folders
  if (!ext || ext === filename) {
    return <Folder size={size} color={expanded ? '#e8ab53' : '#dcb67a'} />;
  }

  // React / JSX / TSX
  if (['jsx', 'tsx'].includes(ext)) {
    return (
      <svg width={size} height={size} viewBox="-11.5 -10.23174 23 20.46348" xmlns="http://www.w3.org/2000/svg">
        <circle cx="0" cy="0" r="2.05" fill="#61dafb"/>
        <g stroke="#61dafb" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2"/>
          <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
          <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
        </g>
      </svg>
    );
  }

  // Python
  if (ext === 'py') {
    return (
      <svg width={size} height={size} viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
        <path d="M53.8,11.2c-20.9,0-20.1,9.1-20.1,9.1l0,9.4h20.5v2.9H32.6c0,0-13.3-1.6-13.3,18.9c0,20.5,11.7,19.6,11.7,19.6h6.7v-9.5c0,0-0.2-11.3,11.5-11.3c11.7,0,20.1,0,20.1,0s10.3,0.3,10.3-10.1c0-10.4,0-17.5,0-17.5S80.3,11.2,53.8,11.2z M42.3,18.8c1.9,0,3.5,1.6,3.5,3.5s-1.6,3.5-3.5,3.5s-3.5-1.6-3.5-3.5S40.4,18.8,42.3,18.8z" fill="#387EB8"/>
        <path d="M55.5,98.8c20.9,0,20.1-9.1,20.1-9.1l0-9.4H55.1v-2.9h21.6c0,0,13.3,1.6,13.3-18.9c0-20.5-11.7-19.6-11.7-19.6h-6.7v9.5c0,0,0.2,11.3-11.5,11.3c-11.7,0-20.1,0-20.1,0s-10.3-0.3-10.3,10.1c0,10.4,0,17.5,0,17.5S43.6,98.8,55.5,98.8z M67,91.2c-1.9,0-3.5-1.6-3.5-3.5s1.6-3.5,3.5-3.5s3.5,1.6,3.5,3.5S68.9,91.2,67,91.2z" fill="#FFE052"/>
      </svg>
    );
  }

  // JavaScript
  if (ext === 'js') {
    return (
      <svg width={size} height={size} viewBox="0 0 630 630" xmlns="http://www.w3.org/2000/svg">
        <rect width="630" height="630" fill="#f7df1e"/>
        <path d="m423.2 492.19c12.69 20.72 29.2 35.95 58.4 35.95 24.53 0 40.2-12.26 40.2-29.2 0-20.3-16.1-27.49-43.1-39.3l-14.8-6.35c-42.72-18.2-71.1-41-71.1-89.2 0-44.4 33.83-78.2 86.7-78.2 37.64 0 64.7 13.1 84.2 47.4l-46.1 29.6c-10.15-18.2-21.1-25.37-38.1-25.37-17.34 0-28.33 11-28.33 25.37 0 17.76 11 24.95 36.4 35.95l14.8 6.34c50.3 21.57 78.7 43.56 78.7 93 0 53.3-41.87 82.5-98.1 82.5-54.98 0-90.5-26.2-107.88-60.54zm-209.13 5.13c9.3 16.5 17.76 30.45 38.1 30.45 19.45 0 31.72-7.61 31.72-37.2v-201.3h59.2v202.1c0 61.3-35.94 89.2-88.4 89.2-47.4 0-74.85-24.53-88.81-54.07z"/>
      </svg>
    );
  }

  // TypeScript
  if (ext === 'ts') {
    return (
      <svg width={size} height={size} viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <path fill="#3178C6" d="M1.5 1.5h125v125H1.5z"/>
        <path fill="#FFF" d="M72.2 101.4c-4.4 0-8.8-1.4-12.4-4-2.8-2-5.4-5.3-5.4-5.3l7-6.2s2.6 3 4.9 4.8c2.4 1.8 5 2.6 7.7 2.6 2.3 0 4.6-.5 6.3-1.6 1.7-1.1 2.6-2.6 2.6-4.4 0-2.3-1.1-3.9-3-4.9-1.3-.7-3.7-1.5-6.8-2.3-3.6-.9-6.8-1.9-9.5-3.2-2.7-1.3-5.1-3.2-7-5.6-1.8-2.4-2.8-5.6-2.8-9.3 0-3.9 1.2-7.3 3.5-10.2 2.3-2.9 5.4-5.1 9.2-6.5 3.8-1.4 8-2.1 12.3-2.1 4.5 0 8.7.9 12.6 2.7 3.8 1.8 6.9 4.3 9.3 7.5l-7 6.4s-1.8-2.4-4.2-4.1c-2.4-1.7-5.6-2.5-9.6-2.5-2.2 0-4.3.5-6 1.4-1.7.9-2.6 2.3-2.6 4.1 0 1.9.9 3.2 2.6 4.1 1.2.7 3.6 1.4 6.8 2.3 3.8 1 7.2 2.1 9.9 3.5 2.8 1.4 5.3 3.4 7.2 5.9 1.9 2.5 2.9 5.8 2.9 9.8 0 4-1.2 7.5-3.6 10.5-2.4 3-5.6 5.3-9.5 6.8-4 1.5-8.4 2.3-13.1 2.3zM49.6 47.9H20v52.2h-9.7V47.9H.2V39h49.4v8.9z"/>
      </svg>
    );
  }

  // HTML
  if (ext === 'html') {
    return <FileCode2 size={size} color="#e34f26" />;
  }

  // CSS
  if (ext === 'css') {
    return <FileCode2 size={size} color="#1572B6" />;
  }

  // JSON
  if (ext === 'json') {
    return <FileJson size={size} color="#cb3837" />;
  }

  // Markdown
  if (ext === 'md') {
    return <FileText size={size} color="#083fa1" />;
  }

  // Images
  if (['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(ext)) {
    return <FileImage size={size} color="#a0522d" />;
  }

  // DB / SQL
  if (['sql', 'db'].includes(ext)) {
    return <Database size={size} color="#336791" />;
  }

  // Config files
  if (['env', 'config', 'gitignore'].includes(ext)) {
    return <Settings size={size} color="#6d7f8b" />;
  }

  // Default File
  return <FileCode2 size={size} color="var(--text-muted)" />;
};
