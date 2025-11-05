// 이미지 라이트박스 컴포넌트
"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
	images: string[];
	initialIndex?: number;
	onClose: () => void;
}

export default function Lightbox({ images, initialIndex = 0, onClose }: Props) {
	const [index, setIndex] = useState(initialIndex);
	const [zoomed, setZoomed] = useState(true); // 처음부터 크게 표시
	const [scale, setScale] = useState(1); // 마우스 휠 확대/축소용
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [translate, setTranslate] = useState({ x: 0, y: 0 });
	const [hasDragged, setHasDragged] = useState(false); // 실제로 드래그가 발생했는지 추적
	// 터치 이벤트용
	const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
	const [touchHasMoved, setTouchHasMoved] = useState(false);
	// 핀치 줌용
	const [pinchStart, setPinchStart] = useState<{ distance: number; scale: number } | null>(null);
	const [wasPinching, setWasPinching] = useState(false); // 핀치 줌이 있었는지 추적
	const total = images.length;
	const current = useMemo(() => images[index], [images, index]);

	// 배경 스크롤 방지
	useEffect(() => {
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = originalOverflow;
		};
	}, []);

	// 키보드 이벤트
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				// 확대된 상태면 원래 크기로, 아니면 라이트박스 닫기
				if (scale > 1) {
					setScale(1);
					setTranslate({ x: 0, y: 0 });
				} else {
					onClose();
				}
			}
			if (e.key === 'ArrowLeft') setIndex((p) => (p - 1 + total) % total);
			if (e.key === 'ArrowRight') setIndex((p) => (p + 1) % total);
		}
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [onClose, total, scale]);

	// 마우스 휠 이벤트 (확대/축소 또는 사진 넘기기)
	useEffect(() => {
		function onWheel(e: WheelEvent) {
			// Ctrl 키와 함께 휠을 굴리면 확대/축소 (모든 상태에서 동작)
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				const delta = e.deltaY > 0 ? -0.1 : 0.1;
				setScale((prev) => Math.max(0.5, Math.min(3, prev + delta)));
				return;
			}

			// 기본 상태(scale === 1)일 때만 일반 휠로 사진 넘기기
			if (scale === 1) {
				e.preventDefault();
				if (e.deltaY > 0) {
					// 아래로 스크롤 = 다음 사진
					goNext();
				} else {
					// 위로 스크롤 = 이전 사진
					goPrev();
				}
			}
		}
		window.addEventListener('wheel', onWheel, { passive: false });
		return () => window.removeEventListener('wheel', onWheel);
	}, [scale, total]);

	// 두 손가락 간 거리 계산 함수
	const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
		const dx = touch2.clientX - touch1.clientX;
		const dy = touch2.clientY - touch1.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	};

	// 터치 이벤트 핸들러 (드래그 및 핀치 줌)
	const handleTouchStart = (e: React.TouchEvent) => {
		// 핀치 줌 직후에는 터치 시작 무시 (확대 상태 유지)
		if (wasPinching) {
			return;
		}

		// 두 손가락 터치 = 핀치 줌
		if (e.touches.length === 2) {
			const distance = getTouchDistance(e.touches[0], e.touches[1]);
			setPinchStart({ distance, scale });
			setWasPinching(true);
			setTouchStart(null);
			setIsDragging(false);
			return;
		}

		// 한 손가락 터치 = 드래그
		const touch = e.touches[0];
		setTouchStart({ x: touch.clientX, y: touch.clientY });
		setTouchHasMoved(false);
		setPinchStart(null);
		
		// 확대된 상태일 때만 드래그 시작
		if (scale > 1) {
			setIsDragging(true);
			setHasDragged(false);
			setDragStart({ x: touch.clientX - translate.x, y: touch.clientY - translate.y });
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		// 두 손가락 터치 = 핀치 줌
		if (e.touches.length === 2 && pinchStart) {
			e.preventDefault();
			const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
			const ratio = currentDistance / pinchStart.distance;
			const newScale = Math.max(0.5, Math.min(3, pinchStart.scale * ratio));
			setScale(newScale);
			return;
		}

		// 한 손가락 터치 = 드래그
		if (!touchStart || scale <= 1) return;
		
		const touch = e.touches[0];
		const deltaX = touch.clientX - touchStart.x;
		const deltaY = touch.clientY - touchStart.y;
		const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		
		// 5px 이상 이동했으면 움직임으로 간주
		if (moveDistance > 5) {
			setTouchHasMoved(true);
			setHasDragged(true);
		}

		// 확대된 상태일 때는 드래그 이동
		if (isDragging) {
			const newX = touch.clientX - dragStart.x;
			const newY = touch.clientY - dragStart.y;
			
			const maxTranslate = 200;
			const clampedX = Math.max(-maxTranslate, Math.min(maxTranslate, newX));
			const clampedY = Math.max(-maxTranslate, Math.min(maxTranslate, newY));
			
			setTranslate({ x: clampedX, y: clampedY });
		}
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		// 핀치 줌 종료
		if (pinchStart) {
			setPinchStart(null);
			// 핀치 줌 후에도 손가락이 남아있으면 드래그로 전환 가능
			if (e.touches.length === 1 && scale > 1) {
				const touch = e.touches[0];
				setTouchStart({ x: touch.clientX, y: touch.clientY });
				setIsDragging(true);
				setHasDragged(false);
				setDragStart({ x: touch.clientX - translate.x, y: touch.clientY - translate.y });
				// 핀치 줌 플래그는 유지 (다음 터치 시작 시 무시하기 위해)
				setTimeout(() => {
					setWasPinching(false);
				}, 500); // 500ms 후에만 터치 클릭으로 인식 가능
			} else {
				// 모든 손가락이 떼어졌으면 핀치 줌 플래그 유지 (일정 시간 후 리셋)
				setTimeout(() => {
					setWasPinching(false);
				}, 500); // 500ms 후에만 터치 클릭으로 인식 가능
			}
			return;
		}

		// 핀치 줌 직후에는 터치 종료도 무시 (확대 상태 유지)
		if (wasPinching) {
			return;
		}

		if (!touchStart) return;

		setIsDragging(false);

		// 확대 상태에서 드래그가 발생했으면 터치 클릭 무시
		if (scale > 1 && hasDragged) {
			setTimeout(() => {
				setHasDragged(false);
				setTouchHasMoved(false);
			}, 100);
			setTouchStart(null);
			return;
		}

		// 확대 상태에서 터치 클릭 (드래그가 없었을 때만)
		if (scale > 1 && !touchHasMoved && !hasDragged) {
			setScale(1);
			setTranslate({ x: 0, y: 0 });
		}

		setTimeout(() => {
			setHasDragged(false);
			setTouchHasMoved(false);
		}, 100);
		setTouchStart(null);
	};

	// 이미지 변경 시 scale 및 translate 초기화
	useEffect(() => {
		setScale(1);
		setTranslate({ x: 0, y: 0 });
	}, [index]);

	// 드래그 핸들러
	const handleMouseDown = (e: React.MouseEvent) => {
		// 확대된 상태일 때만 드래그 가능
		if (scale > 1) {
			e.preventDefault();
			setIsDragging(true);
			setHasDragged(false); // 드래그 시작 시 초기화
			setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
		}
	};

	const handleClick = (e: React.MouseEvent) => {
		// 실제로 드래그가 발생했으면 클릭으로 간주하지 않음
		if (hasDragged || isDragging) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}

		// 확대 상태가 아니면 크기 토글
		if (scale === 1) {
			setZoomed((z) => !z);
		} else {
			// 확대 상태면 초기화
			setScale(1);
			setTranslate({ x: 0, y: 0 });
		}
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (isDragging && scale > 1) {
			const newX = e.clientX - dragStart.x;
			const newY = e.clientY - dragStart.y;
			
			// 실제로 이동이 발생했는지 확인 (5px 이상 이동해야 드래그로 간주)
			const moveDistance = Math.sqrt(
				Math.pow(newX - translate.x, 2) + Math.pow(newY - translate.y, 2)
			);
			if (moveDistance > 5) {
				setHasDragged(true);
			}
			
			// 경계 처리: 이미지가 화면 밖으로 너무 벗어나지 않도록 제한
			const maxTranslate = 200; // 최대 이동 거리 제한
			const clampedX = Math.max(-maxTranslate, Math.min(maxTranslate, newX));
			const clampedY = Math.max(-maxTranslate, Math.min(maxTranslate, newY));
			
			setTranslate({ x: clampedX, y: clampedY });
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);
		// 작은 딜레이 후 hasDragged 초기화 (onClick 이벤트가 먼저 처리되도록)
		setTimeout(() => {
			setHasDragged(false);
		}, 100);
	};

	// 전역 마우스 이벤트 (드래그 중 화면 밖으로 나가도 동작하도록)
	useEffect(() => {
		if (isDragging) {
			const handleGlobalMouseMove = (e: MouseEvent) => {
				const newX = e.clientX - dragStart.x;
				const newY = e.clientY - dragStart.y;
				
				// 실제로 이동이 발생했는지 확인 (이전 translate 값과 비교)
				setTranslate((prev) => {
					const moveDistance = Math.sqrt(
						Math.pow(newX - prev.x, 2) + Math.pow(newY - prev.y, 2)
					);
					if (moveDistance > 5) {
						setHasDragged(true);
					}
					
					const maxTranslate = 200;
					const clampedX = Math.max(-maxTranslate, Math.min(maxTranslate, newX));
					const clampedY = Math.max(-maxTranslate, Math.min(maxTranslate, newY));
					
					return { x: clampedX, y: clampedY };
				});
			};

			const handleGlobalMouseUp = () => {
				setIsDragging(false);
				setTimeout(() => {
					setHasDragged(false);
				}, 100);
			};

			window.addEventListener('mousemove', handleGlobalMouseMove);
			window.addEventListener('mouseup', handleGlobalMouseUp);

			return () => {
				window.removeEventListener('mousemove', handleGlobalMouseMove);
				window.removeEventListener('mouseup', handleGlobalMouseUp);
			};
		}
	}, [isDragging, dragStart]);

	function goPrev() { setIndex((p) => (p - 1 + total) % total); }
	function goNext() { setIndex((p) => (p + 1) % total); }
	
	const handleZoomClick = (targetScale: number) => {
		setScale(targetScale);
		if (targetScale === 1) {
			setTranslate({ x: 0, y: 0 });
		}
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
			<div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
				<button aria-label="닫기" className="absolute right-2 top-2 z-20 rounded bg-white/20 p-2 text-white hover:bg-white/30" onClick={onClose}>
					<X />
				</button>
				{/* 좌/우 대형 클릭 영역 - 화면 끝, 전체 높이 */}
				<button aria-label="이전" className="absolute left-0 top-0 z-10 h-full w-[16vw] min-w-[120px] cursor-pointer bg-transparent hover:bg-white/5" onClick={goPrev} />
				<button aria-label="다음" className="absolute right-0 top-0 z-10 h-full w-[16vw] min-w-[120px] cursor-pointer bg-transparent hover:bg-white/5" onClick={goNext} />

				{/* 표시용 화살표 버튼 */}
				<button aria-label="이전" className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded bg-white/20 p-3 text-white hover:bg-white/30" onClick={goPrev}>
					<ChevronLeft />
				</button>
				<button aria-label="다음" className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded bg-white/20 p-3 text-white hover:bg-white/30" onClick={goNext}>
					<ChevronRight />
				</button>

				{/* 확대 버튼 (모바일 포함 모든 화면) */}
				<div className="flex absolute top-20 left-1/2 z-20 -translate-x-1/2 items-center gap-2 md:gap-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 md:px-4 py-2">
					<span className="hidden md:inline text-sm text-white whitespace-nowrap">확대 및 축소 : Ctrl + 마우스 휠</span>
					<div className="hidden md:block h-4 w-px bg-white/40" />
					<div className="flex gap-1">
						<button
							onClick={() => handleZoomClick(1)}
							className={`px-2 md:px-3 py-1 text-xs rounded transition-colors ${
								scale === 1 
									? 'bg-white/30 text-white font-semibold' 
									: 'bg-white/10 text-white/80 hover:bg-white/20 active:bg-white/25'
							}`}
						>
							100%
						</button>
						<button
							onClick={() => handleZoomClick(1.5)}
							className={`px-2 md:px-3 py-1 text-xs rounded transition-colors ${
								scale === 1.5 
									? 'bg-white/30 text-white font-semibold' 
									: 'bg-white/10 text-white/80 hover:bg-white/20 active:bg-white/25'
							}`}
						>
							150%
						</button>
						<button
							onClick={() => handleZoomClick(2)}
							className={`px-2 md:px-3 py-1 text-xs rounded transition-colors ${
								scale === 2 
									? 'bg-white/30 text-white font-semibold' 
									: 'bg-white/10 text-white/80 hover:bg-white/20 active:bg-white/25'
							}`}
						>
							200%
						</button>
					</div>
				</div>

				<div className="flex h-full items-center justify-center">
					<div 
						className={zoomed ? 'relative w-[96vw] h-[86vh]' : 'relative w-[80vw] max-w-5xl aspect-video'}
						style={{ 
							transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`, 
							transformOrigin: 'center', 
							transition: (isDragging || pinchStart) ? 'none' : (scale !== 1 ? 'transform 0.1s ease-out' : 'none'),
							cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : (zoomed ? 'zoom-out' : 'zoom-in'),
							touchAction: 'none' // 기본 브라우저 핀치 줌 방지, 우리가 직접 구현
						}}
						onMouseDown={handleMouseDown}
						onMouseMove={handleMouseMove}
						onMouseUp={handleMouseUp}
						onClick={handleClick}
						onTouchStart={handleTouchStart}
						onTouchMove={handleTouchMove}
						onTouchEnd={handleTouchEnd}
						onMouseLeave={() => {
							// 마우스가 영역을 벗어날 때는 전역 이벤트가 처리
						}}
					>
						<Image
							src={current || '/placeholder.svg'}
							alt={`이미지 ${index + 1}`}
							fill
							className="object-contain pointer-events-none"
							priority
							draggable={false}
						/>
					</div>
				</div>
				{scale !== 1 && (
					<div className="pointer-events-none absolute top-28 md:top-28 left-1/2 z-20 -translate-x-1/2 rounded bg-black/50 px-3 py-1.5 text-sm text-white">
						{Math.round(scale * 100)}%
					</div>
				)}
				<div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded bg-white/20 px-2 py-1 text-sm text-white">{index + 1} / {total}</div>
			</div>
		</div>
	);
}


