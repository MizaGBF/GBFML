from pathlib import Path
try:
    from PIL import Image
except:
    print("Pillow is required for the image conversion")
    print("python -m pip install pillow")

def convert_png_to_webp(input_dir="png", output_dir="webp"):
    png_path = Path(input_dir)
    webp_path = Path(output_dir)
    
    if not png_path.exists():
        print(f"Error: The source directory '{input_dir}' does not exist.")
        return

    # List all PNG files recursively
    png_files = list(png_path.rglob("*.png"))
    
    if not png_files:
        print(f"No PNG files found in '{input_dir}'.")
        return

    print(f"Found {len(png_files)} PNG file(s). Starting conversion...")

    for file_path in png_files:
        relative_path = file_path.relative_to(png_path)
        # change extension
        target_file_path = webp_path / relative_path.with_suffix(".webp")
        # make directory if needed
        target_file_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            # convert from PNG to WEBP
            with Image.open(file_path) as img:
                img.save(target_file_path, "WEBP", lossless=True)
            print(f"Converted: {file_path} -> {target_file_path}")
        except Exception as e:
            print(f"Failed to convert {file_path}: {e}")

    print("Conversion complete")

if __name__ == "__main__":
    convert_png_to_webp()