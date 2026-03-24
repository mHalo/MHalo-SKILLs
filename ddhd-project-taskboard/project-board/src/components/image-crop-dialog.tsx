"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCropComplete: (croppedUrl: string) => void;
  initialImageSrc?: string;
}

export function ImageCropDialog({
  open,
  onOpenChange,
  onCropComplete,
  initialImageSrc,
}: ImageCropDialogProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const CROP_SIZE = 200;
  const MIN_SCALE = 1;
  const MAX_SCALE = 5;
  const ZOOM_FACTOR = 1.15;

  // 初始化
  useEffect(() => {
    if (open && initialImageSrc) {
      setImageSrc(initialImageSrc);
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      setImageLoaded(false);
      setNaturalSize({ width: 0, height: 0 });
    }
  }, [open, initialImageSrc]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      const imgWidth = imageRef.current.naturalWidth;
      const imgHeight = imageRef.current.naturalHeight;
      setNaturalSize({ width: imgWidth, height: imgHeight });

      // 初始缩放：图片宽度 = 裁剪区宽度
      const initialScale = CROP_SIZE / imgWidth;
      setScale(initialScale);

      // 垂直居中
      const scaledHeight = imgHeight * initialScale;
      const offsetY = (CROP_SIZE - scaledHeight) / 2;
      setTranslate({ x: 0, y: offsetY });

      setImageLoaded(true);
    }
  };

  // 滚轮缩放 - 以图片中心为基准
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const zoomIn = e.deltaY < 0;
    const factor = zoomIn ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    const newScale = scale * factor;

    // 限制缩放范围
    const minScale = CROP_SIZE / naturalSize.width;
    const clampedScale = Math.min(MAX_SCALE, Math.max(minScale, newScale));

    if (clampedScale === scale) return;

    setScale(clampedScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  // 限制拖拽位置：图片边缘不能进入裁剪区内部
  const clampTranslate = (x: number, y: number) => {
    const scaledWidth = naturalSize.width * scale;
    const scaledHeight = naturalSize.height * scale;

    // 水平方向：图片小时居中，图片大时边缘对齐
    let clampedX = x;
    if (scaledWidth <= CROP_SIZE) {
      clampedX = (CROP_SIZE - scaledWidth) / 2;
    } else {
      // 图片比裁剪区大时，边缘必须对齐
      const minX = CROP_SIZE - scaledWidth; // 负值
      const maxX = 0;
      clampedX = Math.min(maxX, Math.max(minX, x));
    }

    // 垂直方向：图片小时居中，图片大时边缘对齐
    let clampedY = y;
    if (scaledHeight <= CROP_SIZE) {
      clampedY = (CROP_SIZE - scaledHeight) / 2;
    } else {
      const minY = CROP_SIZE - scaledHeight;
      const maxY = 0;
      clampedY = Math.min(maxY, Math.max(minY, y));
    }

    return { x: clampedX, y: clampedY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;

    dragStart.current = { x: e.clientX, y: e.clientY };

    setTranslate((prev) => {
      const newX = prev.x + deltaX;
      const newY = prev.y + deltaY;
      return clampTranslate(newX, newY);
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getCroppedImage = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!imageRef.current || !imageLoaded) {
        reject("No image");
        return;
      }

      const img = imageRef.current;

      // 创建临时 canvas 来精确裁剪
      const canvas = document.createElement("canvas");
      canvas.width = CROP_SIZE;
      canvas.height = CROP_SIZE;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject("No canvas context");
        return;
      }

      // 计算图片在 canvas 中的实际尺寸和位置
      const imgWidth = naturalSize.width;
      const imgHeight = naturalSize.height;
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;

      // translate 是图片左上角在容器中的位置
      const imgLeft = translate.x;
      const imgTop = translate.y;

      // 从原始图片裁剪对应区域
      // 裁剪区域的左上角在原始图片上的位置
      const cropX = (-imgLeft / scaledWidth) * imgWidth;
      const cropY = (-imgTop / scaledHeight) * imgHeight;
      const cropSize = (CROP_SIZE / scaledWidth) * imgWidth;

      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropSize,
        cropSize,
        0,
        0,
        CROP_SIZE,
        CROP_SIZE
      );

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject("Canvas is empty");
            return;
          }
          try {
            const formData = new FormData();
            const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
            formData.append("file", file);

            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            if (!res.ok) {
              throw new Error("Upload failed");
            }

            const data = await res.json();
            resolve(data.url);
          } catch (error) {
            reject(error);
          }
        },
        "image/jpeg",
        0.9
      );
    });
  }, [scale, translate, naturalSize, imageLoaded]);

  const handleCropAndUpload = async () => {
    if (!imageSrc || !imageLoaded) return;

    try {
      const croppedUrl = await getCroppedImage();
      onCropComplete(croppedUrl);
      setImageSrc("");
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      setImageLoaded(false);
      setNaturalSize({ width: 0, height: 0 });
      onOpenChange(false);
      toast.success("头像上传成功");
    } catch (error) {
      console.error("裁切上传失败:", error);
      toast.error("头像上传失败");
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setImageSrc("");
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      setImageLoaded(false);
      setNaturalSize({ width: 0, height: 0 });
    }
    onOpenChange(isOpen);
  };

  const handleReselect = () => {
    // 清空状态并关闭弹窗，让用户重新从编辑用户信息处选择图片
    setImageSrc("");
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setImageLoaded(false);
    setNaturalSize({ width: 0, height: 0 });
    onOpenChange(false);
  };

  // 计算显示尺寸
  const displayWidth = naturalSize.width * scale;
  const displayHeight = naturalSize.height * scale;

  // 显示百分比
  const displayPercent = Math.round((scale / (CROP_SIZE / naturalSize.width || 1)) * 100);

  return (
    <Dialog open={open} onOpenChange={handleClose} modal={true}>
      <DialogContent className="sm:max-w-md z-80">
        <div className="relative space-y-4 py-4">
          <div className="text-center">
            <h3 className="text-lg font-medium">上传头像</h3>
            <p className="text-sm text-muted-foreground">滚轮缩放 · 拖拽移动</p>
          </div>
          {imageSrc ? (
            <div className="space-y-4">
              {/* 遮罩层容器 */}
              <div className="relative flex items-center justify-center">
                  {/* 裁剪区域 - 居中显示 */}
                  <div
                    ref={containerRef}
                    className="relative overflow-hidden rounded-lg select-none mx-auto"
                    style={{
                      width: CROP_SIZE,
                      height: CROP_SIZE,
                      backgroundColor: "#f3f4f6",
                      cursor: isDragging ? "grabbing" : "grab",
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                  >
                    <img
                      ref={imageRef}
                      src={imageSrc}
                      alt="待裁切"
                      className="absolute pointer-events-none"
                      draggable={false}
                      style={{
                        width: displayWidth,
                        height: displayHeight,
                        maxWidth: "none",
                        left: translate.x,
                        top: translate.y,
                      }}
                      onLoad={handleImageLoad}
                      crossOrigin="anonymous"
                    />
                  </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                滚轮缩放 · 拖拽移动 · {displayPercent}%
              </p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              请在编辑用户信息中上传头像
            </div>
          )}
        </div>
        <DialogFooter>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleReselect}>
                重新选择
              </Button>
              <Button onClick={handleCropAndUpload} disabled={!imageLoaded}>
                确认
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
