export class WebResponse<T> {
  data?: T;
  errors?: string;
  paging?: Paging;
}

export class Paging {
  page?: number;      // halaman sekarang
  totalPage?: number; // total halaman
  size?: number;      // jumlah item per halaman
}