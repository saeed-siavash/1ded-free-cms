<?php
declare(strict_types=1);
define('CMS_ENTRY',true);
require __DIR__.'/../app/core.php';require __DIR__.'/../app/model.php';require __DIR__.'/../app/render.php';
foreach(['javascript:alert(1)','JaVaScRiPt:alert(1)','data:text/html,<script>alert(1)</script>','//evil.example/','/../app/config.php',"https://example.test/\r\nLocation:x",'https://user:pass@example.test/','https:\\evil.example/'] as $url)if(safe_url($url)!=='')throw new RuntimeException('Unsafe URL accepted');
foreach(['https://example.test/path','/contact/','#section','mailto:hello@example.test'] as $url)if(safe_url($url)!==$url)throw new RuntimeException('Safe URL changed');
foreach(['<script>alert(1)</script>','<img src=x onerror=alert(1)>','[click](javascript:alert(1))','**<svg onload=alert(1)>**'] as $source){$html=rich($source);if(preg_match('/<(script|img|svg)\b|href="javascript:/i',$html))throw new RuntimeException('Untrusted markup escaped incorrectly');}
echo "URL scheme, control character and rich-text escaping vectors passed.\n";
