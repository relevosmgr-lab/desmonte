import subprocess
import datetime
import sys

def ejecutar_comando(comando, descripcion):
    """Ejecuta un comando en la terminal y maneja los errores."""
    print(f"\n⏳ {descripcion}...")
    try:
        # Ejecutamos el comando
        resultado = subprocess.run(
            comando, 
            shell=True, 
            check=True, 
            text=True, 
            capture_output=True
        )
        if resultado.stdout.strip():
            print(resultado.stdout.strip())
            
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error al intentar: {descripcion}")
        print(f"Detalle del error:\n{e.stderr}")
        sys.exit(1) # Detiene el script si hay un error

def main():
    print("="*40)
    print("🚀 AUTOMATIZADOR DE DEPLOY A GITHUB 🚀")
    print("="*40)

    # 1. Pedir mensaje de commit
    mensaje = input("\n📝 Ingresa el mensaje del commit (presiona Enter para usar la fecha/hora actual): ").strip()
    
    if not mensaje:
        fecha_actual = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        mensaje = f"Actualización automática: {fecha_actual}"

    # 2. git add . (Agrega todos los cambios)
    ejecutar_comando("git add .", "Agregando archivos modificados al área de preparación (staging)")

    # 3. git commit -m (Crea el paquete de cambios)
    # Se usan comillas dobles para el mensaje por si contiene espacios
    ejecutar_comando(f'git commit -m "{mensaje}"', f"Creando commit con el mensaje: '{mensaje}'")

    # 4. git push (Sube a GitHub)
    # Nota: Si tu rama principal se llama 'master' en vez de 'main', cambiá la palabra abajo
    ejecutar_comando("git push origin main", "Subiendo los cambios a GitHub (rama 'main')")

    print("\n" + "="*40)
    print("✅ ¡PROYECTO ACTUALIZADO CON ÉXITO EN GITHUB!")
    print("="*40)

if __name__ == "__main__":
    main()