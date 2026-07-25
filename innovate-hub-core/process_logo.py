from PIL import Image
import base64

def remove_background(image_path, output_path):
    try:
        img = Image.open(image_path).convert("RGBA")
        datas = img.getdata()
        
        new_data = []
        for item in datas:
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
                
        img.putdata(new_data)
        img.save(output_path, "PNG")
        print("Successfully removed background and saved as PNG")
    except Exception as e:
        print(f"Error processing image: {e}")

def to_svg(png_path, svg_path):
    try:
        with open(png_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
        
        img = Image.open(png_path)
        width, height = img.size
        
        svg_data = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <image href="data:image/png;base64,{encoded_string}" x="0" y="0" width="{width}" height="{height}" />
</svg>"""

        with open(svg_path, "w", encoding="utf-8") as svg_file:
            svg_file.write(svg_data)
        print("Successfully converted PNG to SVG")
    except Exception as e:
        print(f"Error creating SVG: {e}")

if __name__ == "__main__":
    remove_background("public/uploaded-logo.jpg", "public/uploaded-logo.png")
    to_svg("public/uploaded-logo.png", "public/logo.svg")
