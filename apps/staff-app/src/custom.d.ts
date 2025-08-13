// 文件路径: apps/staff-app/src/custom.d.ts

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css';