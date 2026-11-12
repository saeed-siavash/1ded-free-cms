<?php
declare(strict_types=1);
define('CMS_ENTRY',true);
require __DIR__.'/../app/core.php';require __DIR__.'/../app/security.php';
$secret=base32_encode('12345678901234567890');
if(base32_decode($secret)!=='12345678901234567890')throw new RuntimeException('Base32 round trip failed');
// SHA-1 / eight-digit examples published in RFC 6238, Appendix B.
$vectors=[59=>'94287082',1111111109=>'07081804',1111111111=>'14050471',1234567890=>'89005924',2000000000=>'69279037',20000000000=>'65353130'];
foreach($vectors as $time=>$expected)if(totp_at($secret,$time,8)!==$expected)throw new RuntimeException('RFC 6238 vector failed at '.$time);
echo "RFC 6238 SHA-1 vectors and Base32 checks passed.\n";
