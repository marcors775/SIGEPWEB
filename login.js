$(document).ready(function () {
  $('#frm').on('submit', function (e) {
    e.preventDefault();
    login();
  });

  $('#usu').on('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
  });

  $('#cla').on('input', function () {
    this.value = this.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  });

  function login() {
    const formData = new FormData($('#frm')[0]);
    const cedula = formData.get('usu');

    // ✅ Adjuntar token CSRF desde meta al FormData
    const token = document.querySelector('meta[name="csrf-token"]')?.content;
    if (token) formData.append('csrf_token', token);

    if (!cedula || !formData.get('cla')) {
      mostrarAlerta('warning', 'Completa todos los campos.');
      return;
    }

    $.ajax({
      url: '../Ajax/login.php?op=validar',
      method: 'POST',
      data: formData,
      contentType: false,
      processData: false,
      success: function (datos) {
        try {
          const response = JSON.parse(datos);

          if (response.status === 'ok') {
            verificarPermiso(cedula);
          } else {
            mostrarAlerta('error', response.message || 'Credenciales incorrectas.');
          }
        } catch (e) {
          console.error('Error procesando respuesta:', e);
          mostrarAlerta('error', 'Error inesperado al procesar la respuesta.');
        }
      },
      error: function (xhr, status, error) {
        console.error('AJAX error:', status, error);
        const mensaje = xhr.responseText || 'Error del servidor.';
        mostrarAlerta('error', mensaje);
      }
    });
  }

  function verificarPermiso(cedula) {
    $.get(`../Ajax/login.php?op=rolesPermitidos&cedula=${cedula}`, function (data) {
      try {
        const result = JSON.parse(data);
        if (result.permitido) {
          window.location.href = '../Vista/escritorio.php';
        } else {
          mostrarAlerta('warning', 'No tienes permisos asignados.');
        }
      } catch (e) {
        console.error('Error al verificar permisos:', e);
        mostrarAlerta('error', 'Error validando permisos.');
      }
    });
  }

  function mostrarAlerta(tipo, mensaje) {
    Swal.fire({
      icon: tipo,
      title: mensaje,
      toast: true,
      timer: 2500,
      showConfirmButton: false,
      position: 'top-end'
    });

    // ✅ Mostrar aviso visual si hay error del servidor
    if (tipo === 'error' && mensaje.toLowerCase().includes('servidor')) {
      const aviso = document.getElementById('avisoCache');
      if (aviso) aviso.style.display = 'block';
    }
  }
});
