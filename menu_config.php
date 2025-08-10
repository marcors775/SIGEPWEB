<?php
$menuOptions = [
    'Coordinador' => [
        [
            'name' => 'Niños',
            'icon' => 'fa-solid fa-file-circle-plus',
            'submenus' => [
                ['name' => 'Subir Información', 'link' => 'gestionNinos.php'],  
                ['name' => 'Modificar', 'link' => 'modificarInformacion.php'],
                ['name'=> 'Asignar', 'link' => 'asignarAdministradores.php']
            ]
        ],
        [
            'name' => 'Definir tiempos',
            'icon' => 'fa-solid fa-calendar-days',
            'link' => 'tiempos.php'
        ],
        [
            'name' => 'Informes',
            'icon' => 'fa-solid fa-file-alt',
            'submenus' => [
		['name' => 'Mensuales', 'link' => 'Mensuales.php'],
                ['name' => 'Semestrales', 'link' => 'Semestral.php'],
                ['name' => 'Anuales', 'link' => 'Anual.php']
            ]
        ],
        [
            'name' => 'Gestión',
            'icon' => 'fa-solid fa-cogs',
            'link' => 'usuarios.php'
        ]
    ],
    'Admin' => [
        [
            'name' => 'Asignar Cartas',
            'icon' => 'fas fa-tachometer-alt',
            'link' => 'asignarCartas.php'
        ],
        [
            'name' => 'Informes',
            'icon' => 'fa-solid fa-file',
            'submenus' => [
                ['name' => 'Mensuales', 'link' => 'Mensuales.php'],
                ['name' => 'Semestrales', 'link' => 'Semestral.php'],
                ['name' => 'Anuales', 'link' => 'Anual.php']
            ]
        ],
        [
            'name' => 'Notificaciones',
            'icon' => 'fas fa-project-diagram',
            'link' => 'Notificaciones.php'
        ],
        [
            'name' => 'Parametros',
            'icon' => 'fa-solid fa-file',
            'submenus' => [
                ['name' => 'Planes Futuros', 'link' => 'planesFuturos.php'],
                ['name' => 'Observaciones', 'link' => 'observaciones.php'],
                ['name' => 'Motivos de Devolucion', 'link' => 'motivosDevolucion.php']
            ]
        ],
    ],
    'Correspondencia' => [
    [
            'name' => 'Correspondencia',
            'icon' => 'fa-solid fa-envelope',
            'submenus' => [
                ['name' => 'Gestión', 'link' => 'gestionCorrespondencia.php'],
                ['name' => 'Envio', 'link' => 'envioCorrespondencia.php'],
                ['name'=> 'Hoja','link'=>'hojaRuta.php']
            ]
    ]
    
    ],

    'Actualizar ram' => [
        [
            'name' => 'Actualizar RAM',
            'icon' => 'fa-solid fa-file-pen',
            'link' => 'modificarInformacion.php'
        ]
    ],
    'Progreso' => [
    [
            'name' => 'Progreso',
            'icon' => 'fa-solid fa-envelope',
            'link' => 'progreso.php'
        ]
    ],
    'Seguimiento' => [
    [
            'name' => 'Seguimientos',
            'icon' => 'fa-solid fa-contact-book',
            'submenus' => [
                ['name' => 'Casos', 'link' => 'casos.php'],
                ['name' => 'Ausencias Temporales', 'link' => 'ausenciasTemporales.php'],
                ['name' => 'Avisos de Embarazo', 'link' => 'avisosEmbarazo.php']
            ]
        ]
    ]
];
?>


