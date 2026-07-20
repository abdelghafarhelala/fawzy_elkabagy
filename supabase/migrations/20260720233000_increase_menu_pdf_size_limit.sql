-- Allow larger full-menu PDFs (was 10 MB)
update storage.buckets
set file_size_limit = 52428800 -- 50 MB
where id = 'menu-pdfs';
