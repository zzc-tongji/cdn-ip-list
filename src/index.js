import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import fetch from 'node-fetch';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fetchWithTimeout = (url, data, timeoutMs) => {
  let timer = null;
  return Promise.race([
    fetch(url, data),
    new Promise((_, reject) => {
      if (typeof timeoutMs !== 'number' && timeoutMs <= 0) {
        timeoutMs = 60000;
      }
      timer = setTimeout(() => {
        reject(new Error(`fail to fetch | timeout in ${timeoutMs} ms`));
      }, timeoutMs);
    }),
  ]).finally(() => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  });
};

const main = async () => {
  try {
    const data = [];
    // Amazon CloudFront
    await fetchWithTimeout('https://d7uri8nf7uskq.cloudfront.net/tools/list-cloudfront-ips', {}, 10000).then((res) => {
      return res.text();
    }).then((jsonText) => {
      let d;
      try {
        d = JSON.parse(jsonText);
      } catch {
        throw new Error(`fail to get IPv4 list of Amazon CloudFront | ${jsonText}`);
      }
      if (d.CLOUDFRONT_GLOBAL_IP_LIST instanceof Array) {
        data.push(...d.CLOUDFRONT_GLOBAL_IP_LIST.map((cidr) => {
          return { cidr, name: 'Amazon CloudFront' };
        }));
      }
      if (d.CLOUDFRONT_REGIONAL_EDGE_IP_LIST instanceof Array) {
        data.push(...d.CLOUDFRONT_REGIONAL_EDGE_IP_LIST.map((cidr) => {
          return { cidr, name: 'Amazon CloudFront' };
        }));
      }
    });
    // Cloudflare
    await fetchWithTimeout('https://api.cloudflare.com/client/v4/ips', {}, 10000).then((res) => {
      return res.text();
    }).then((jsonText) => {
      let d;
      try {
        d = JSON.parse(jsonText);
      } catch {
        throw new Error(`fail to get IPv4 list of Cloudflare | ${jsonText}`);
      }
      if (!(d?.result?.ipv4_cidrs instanceof Array)) {
        return;
      }
      data.push(...d.result.ipv4_cidrs.map((cidr) => {
        return { cidr, name: 'Cloudflare' };
      }));
    });
    // nginx conf
    let lineList = [];
    lineList.push(`# The file is generated at ${(new Date()).toISOString()}`);
    lineList.push('# by `https://github.com/zzc-tongji/cdn-ip-list`.');
    lineList.push('');
    lineList.push('# Add the current file to directory `<nginx>/conf.d`.');
    lineList.push('geo $cdn_ip_list {');
    lineList.push('  default \'\';');
    lineList.push(...data.map((d) => `  ${d.cidr} '${d.name}';`));
    lineList.push('}');
    lineList.push('');
    lineList.push('# To restrict IPv4 from CDN IP,');
    lineList.push('# add following lines to "server" section of nginx configuration.');
    lineList.push('#');
    lineList.push('# if ($cdn_ip_list = \'\') {');
    lineList.push('#   return 444;');
    lineList.push('# }');
    lineList.push('');
    const nginxConf = lineList.join('\n');
    // write file
    const output = path.normalize(`${__dirname}${path.sep}..${path.sep}output`);
    fs.mkdirSync(output, { recursive: true });
    const nginx = `${output}${path.sep}cdn_ip_list.nginx.conf`;
    fs.writeFileSync(`${output}${path.sep}cdn_ip_list.nginx.conf`, nginxConf);
    console.log(`succeed | ${nginx}`);
    //
    return 0;
  } catch (error) {
    console.error(error?.message || error);
    return 1;
  }
};

main().then((exitCode) => {
  process.exit(exitCode);
});
