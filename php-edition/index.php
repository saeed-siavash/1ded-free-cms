<?php
declare(strict_types=1);
define('CMS_ENTRY',true);
require __DIR__.'/app/core.php';
require __DIR__.'/app/model.php';
require __DIR__.'/app/security.php';
require __DIR__.'/app/render.php';
require __DIR__.'/app/maintenance.php';require __DIR__.'/app/restore-recovery.php';
require __DIR__.'/app/health.php';
require __DIR__.'/app/http.php';
cms_main();
